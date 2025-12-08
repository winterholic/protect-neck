# 🏥 목 건강 지킴이 (Protect Neck)

30분마다 목/어깨 스트레칭을 유도하여 거북목을 예방하는 데스크톱 애플리케이션

## ✨ 주요 기능

- ⏰ **30분 타이머** - 일시정지/재생 기능
- 🎯 **자동 알림** - 시간이 되면 자동으로 창이 나타남
- 💪 **7단계 스트레칭 가이드** - 이미지와 타이머로 안내
- 🚶 **화장실/산책 모드** - 경과 시간 측정
- 🔔 **시스템 트레이** - 백그라운드 실행
- 🎨 **모던한 UI** - 깔끔한 디자인

## 📸 스크린샷

<!-- 나중에 추가 -->
_스크린샷 추가 예정_

## 🚀 설치 및 실행

### 방법 1: Python으로 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/protect-neck.git
cd protect-neck

# 2. 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 실행
python main.py
```

### 방법 2: 실행 파일 (EXE)

```bash
# 빌드
python build_exe.py

# 실행
dist/목건강지킴이.exe
```

## 🛠️ 기술 스택

- **Python 3.10+**
- **PyQt5** - GUI 프레임워크
- **PyInstaller** - 실행 파일 빌드
- **Pillow** - 이미지 처리

## 📂 프로젝트 구조

```
protectneck/
├── main.py              # 진입점
├── utils.py             # 유틸리티
├── core/                # 비즈니스 로직
│   ├── timer.py         # 타이머
│   └── sequence.py      # 스트레칭 시퀀스
├── ui/                  # UI 컴포넌트
│   ├── main_window.py   # 메인 윈도우
│   ├── timer_widget.py  # 타이머 화면
│   ├── choice_widget.py # 선택 화면
│   ├── break_widget.py  # 산책 화면
│   └── stretch_widget.py # 스트레칭 화면
└── resources/           # 리소스
    ├── images/          # 이미지
    └── styles/          # 스타일시트
```

## 💡 사용 방법

1. 프로그램 실행
2. "시작하기" 버튼 클릭
3. 30분 후 자동으로 선택 화면 표시
4. 선택:
   - **나중에 하기** - 타이머 재시작
   - **스트레칭 시작** - 7단계 가이드 진행
   - **화장실/산책** - 자유 시간 측정

### 시스템 트레이

- 창 닫기(X) → 트레이로 최소화
- 트레이 아이콘 더블클릭 → 창 열기
- 트레이 우클릭 → 메뉴 (열기/종료)

## 📖 개발 가이드

자세한 개발 가이드는 [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)를 참고하세요.

## 🤝 기여

이슈와 PR을 환영합니다!

## 📄 라이센스

MIT License

## 👤 Author

**Your Name**

---

**건강한 개발 생활을 위해! 💪**
