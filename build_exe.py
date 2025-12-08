# -*- coding: utf-8 -*-
"""
EXE Build Script
This script converts PNG icon to ICO and builds the executable
"""

import os
from PIL import Image

def convert_icon():
    """Convert PNG icon to ICO format for PyInstaller"""
    png_path = 'resources/images/icon.png'
    ico_path = 'resources/images/icon.ico'

    if os.path.exists(png_path):
        try:
            img = Image.open(png_path)
            # ICO format supports multiple sizes
            img.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (256, 256)])
            print(f'Successfully converted {png_path} to {ico_path}')
            return ico_path
        except Exception as e:
            print(f'Failed to convert icon: {e}')
            return None
    else:
        print(f'Icon file not found: {png_path}')
        return None

def build_exe():
    """Build executable using PyInstaller"""
    ico_path = convert_icon()

    if ico_path and os.path.exists(ico_path):
        icon_option = f'--icon={ico_path}'
    else:
        icon_option = ''
        print('Building without icon...')

    # PyInstaller command with resources included
    cmd = (
        f'pyinstaller --onefile --windowed {icon_option} '
        f'--add-data "resources;resources" '
        f'--name="목건강지킴이" main.py'
    )

    print(f'\nExecuting: {cmd}\n')
    os.system(cmd)

    print('\n' + '='*50)
    print('Build completed!')
    print('EXE file location: dist/목건강지킴이.exe')
    print('\nNote: EXE now includes all resources (styles, images)')
    print('You can distribute just the EXE file!')
    print('='*50)

if __name__ == '__main__':
    build_exe()
