# EXE 빌드 가이드

## 1. 필요한 패키지 설치

```bash
pip install pyinstaller pillow
```

## 2. 빌드 실행

### 방법 1: 자동 빌드 스크립트 사용 (권장)

```bash
python build_exe.py
```

이 스크립트는:
- PNG 아이콘을 ICO로 자동 변환
- PyInstaller로 EXE 빌드
- 아이콘 적용

### 방법 2: 수동 빌드

```bash
# PyInstaller 실행
pyinstaller --onefile --windowed --icon=resources/images/icon.ico --name="목건강지킴이" main.py
```

## 3. 빌드 결과

- **EXE 파일 위치**: `dist/목건강지킴이.exe`
- **빌드 파일들**: `build/` 폴더 (삭제 가능)
- **스펙 파일**: `목건강지킴이.spec` (삭제 가능)

## 4. 배포

`dist/목건강지킴이.exe` 파일을 다른 사용자에게 배포할 수 있습니다.

**주의**: EXE 파일은 단독 실행 가능하지만, `resources/` 폴더도 함께 배포해야 합니다 (스타일시트와 이미지 파일 때문).

## 5. 리소스 파일 포함 빌드 (선택사항)

리소스 파일까지 EXE에 포함하려면:

```bash
pyinstaller --onefile --windowed --icon=resources/images/icon.ico --add-data "resources;resources" --name="목건강지킴이" main.py
```

이 경우 EXE 파일 하나만으로 실행 가능합니다.
