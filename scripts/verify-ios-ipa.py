#!/usr/bin/env python3
"""Verify the actual ZIP, iPhone metadata and unsigned arm64 Mach-O in an IPA."""

import argparse
import hashlib
import json
import plistlib
import struct
import zipfile
from pathlib import Path, PurePosixPath


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_macho(binary):
    # A physical-device archive built with ARCHS=arm64 must be a thin arm64
    # executable. Simulator arm64 has the same CPU type, so also inspect the
    # LC_BUILD_VERSION platform instead of relying on the architecture alone.
    require(len(binary) >= 32, 'Application executable is truncated')
    require(binary[:4] == b'\xcf\xfa\xed\xfe', 'Expected a thin 64-bit Mach-O executable')
    _, cpu, _, file_type, command_count, command_bytes, _, _ = struct.unpack_from(
        '<8I', binary,
    )
    require(cpu == 0x0100000C, f'Executable is not arm64: CPU type {cpu:#x}')
    require(file_type == 2, 'Application binary is not a Mach-O executable')
    require(32 + command_bytes <= len(binary), 'Mach-O load commands are truncated')
    cursor = 32
    platforms = []
    for _ in range(command_count):
        require(cursor + 8 <= 32 + command_bytes, 'Invalid Mach-O command header')
        command, size = struct.unpack_from('<2I', binary, cursor)
        require(size >= 8 and cursor + size <= 32 + command_bytes, 'Invalid Mach-O command size')
        require(command != 0x1D, 'Executable still contains a code signature')
        if command == 0x32:  # LC_BUILD_VERSION
            require(size >= 24, 'Invalid LC_BUILD_VERSION command')
            platforms.append(struct.unpack_from('<I', binary, cursor + 8)[0])
        if command in (0x21, 0x2C):  # LC_ENCRYPTION_INFO / LC_ENCRYPTION_INFO_64
            require(size >= 20, 'Invalid Mach-O encryption command')
            require(struct.unpack_from('<I', binary, cursor + 16)[0] == 0,
                    'Executable is encrypted and cannot be re-signed normally')
        cursor += size
    require(cursor == 32 + command_bytes, 'Mach-O command table length mismatch')
    require(platforms == [2], f'Expected the iOS device platform (2), found {platforms}')
    return {'architecture': 'arm64', 'macho_platform': 'iOS (2)', 'signed': False}


def verify(path):
    require(path.is_file(), f'IPA does not exist: {path}')
    require(path.stat().st_size >= 1024 * 1024, 'IPA is implausibly small (less than 1 MiB)')
    require(zipfile.is_zipfile(path), 'IPA is not a ZIP archive')
    with zipfile.ZipFile(path) as archive:
        require(archive.testzip() is None, 'ZIP CRC verification failed')
        names = archive.namelist()
        require(len(names) == len(set(names)), 'ZIP contains duplicate entries')
        for name in names:
            parts = PurePosixPath(name).parts
            require(not name.startswith('/') and '..' not in parts, 'ZIP contains an unsafe path')
        applications = {
            PurePosixPath(name).parts[1]
            for name in names
            if len(PurePosixPath(name).parts) >= 2
            and PurePosixPath(name).parts[0] == 'Payload'
            and PurePosixPath(name).parts[1].endswith('.app')
        }
        require(len(applications) == 1, f'Expected exactly one Payload/*.app: {applications}')
        application = 'Payload/' + next(iter(applications))
        info_path = application + '/Info.plist'
        require(info_path in names, 'Application Info.plist is missing')
        info = plistlib.loads(archive.read(info_path))
        executable = info.get('CFBundleExecutable')
        require(isinstance(executable, str) and executable and '/' not in executable,
                'Invalid CFBundleExecutable')
        binary_path = application + '/' + executable
        require(binary_path in names, 'Application executable is missing')
        require(info.get('CFBundleSupportedPlatforms') == ['iPhoneOS'],
                'CFBundleSupportedPlatforms is not iPhoneOS')
        require(info.get('DTPlatformName') == 'iphoneos', 'DTPlatformName is not iphoneos')
        require(info.get('DTSDKName', '').startswith('iphoneos'), 'Application SDK is not iphoneos')
        require(1 in info.get('UIDeviceFamily', []), 'Application does not support iPhone')
        require(info.get('CFBundlePackageType') == 'APPL', 'Bundle is not an application')
        require(not info.get('MinimumOSVersion', '').endswith('Simulator'), 'Simulator metadata found')
        require(application + '/main.jsbundle' in names, 'Release JavaScript bundle is missing')
        require(archive.getinfo(application + '/main.jsbundle').file_size > 1024,
                'Release JavaScript bundle is empty')
        require(not any('_CodeSignature' in PurePosixPath(name).parts for name in names),
                'IPA contains code-signing metadata')
        require(not any(PurePosixPath(name).name == 'embedded.mobileprovision' for name in names),
                'IPA contains a provisioning profile')
        binary = archive.read(binary_path)
        require(len(binary) > 1024 * 1024, 'Native executable is implausibly small')
        executable_info = verify_macho(binary)
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return {
        'ipa': path.name,
        'zip_integrity': 'PASS',
        'application': application,
        'bundle_identifier': info.get('CFBundleIdentifier'),
        'version': info.get('CFBundleShortVersionString'),
        'sdk': info['DTSDKName'],
        'minimum_ios': info.get('MinimumOSVersion'),
        'device': 'iPhone',
        **executable_info,
        'native_executable_bytes': len(binary),
        'ipa_bytes': path.stat().st_size,
        'sha256': digest.hexdigest(),
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ipa', type=Path)
    parser.add_argument('--report', type=Path)
    arguments = parser.parse_args()
    report = json.dumps(verify(arguments.ipa), indent=2) + '\n'
    if arguments.report:
        arguments.report.write_text(report)
    print(report, end='')
