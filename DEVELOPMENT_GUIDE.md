# 목 건강 지킴이 - 개발 가이드

## 📚 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택 설명](#기술-스택-설명)
3. [프로젝트 구조](#프로젝트-구조)
4. [핵심 개념](#핵심-개념)
5. [파일별 상세 설명](#파일별-상세-설명)
6. [코드 흐름 분석](#코드-흐름-분석)
7. [주요 기능 구현](#주요-기능-구현)
8. [빌드 프로세스](#빌드-프로세스)
9. [확장 가능성](#확장-가능성)

---

## 프로젝트 개요

### 목적
30분마다 목/어깨 스트레칭을 유도하여 거북목을 예방하는 데스크톱 애플리케이션

### 주요 기능
- 30분 타이머 (일시정지/재생)
- 타이머 완료 시 자동으로 창 표시
- 3가지 선택지: 스킵, 스트레칭, 화장실/산책
- 7단계 스트레칭 가이드 (이미지 + 타이머 + 자막)
- 시스템 트레이 백그라운드 실행
- 모던한 UI 디자인 (QSS 스타일시트)

---

## 기술 스택 설명

### 1. Python 3.10+
- 프로그램의 기반 언어
- 객체지향 프로그래밍 활용

### 2. PyQt5
**GUI 프레임워크**
- Qt: C++로 작성된 크로스 플랫폼 GUI 프레임워크
- PyQt5: Qt의 Python 바인딩
- 강력한 위젯 시스템과 이벤트 처리

**주요 컴포넌트:**
- `QApplication`: 애플리케이션 객체
- `QMainWindow`: 메인 윈도우
- `QWidget`: 모든 UI 요소의 기본 클래스
- `QTimer`: 타이머 기능
- `QSystemTrayIcon`: 시스템 트레이 아이콘
- `QStackedWidget`: 화면 전환

### 3. Pillow
- 이미지 처리 라이브러리
- PNG를 ICO로 변환 (아이콘)

### 4. PyInstaller
- Python 프로그램을 실행 파일(EXE)로 변환
- 단일 파일로 배포 가능

---

## 프로젝트 구조

```
protectneck/
├── main.py                      # 애플리케이션 진입점
├── utils.py                     # 유틸리티 함수 (리소스 경로)
├── requirements.txt             # 의존성 목록
├── build_exe.py                 # EXE 빌드 스크립트
│
├── core/                        # 비즈니스 로직
│   ├── __init__.py
│   ├── timer.py                 # 타이머 컨트롤러
│   └── sequence.py              # 스트레칭 시퀀스 데이터
│
├── ui/                          # UI 컴포넌트
│   ├── __init__.py
│   ├── main_window.py           # 메인 윈도우 + 시스템 트레이
│   ├── timer_widget.py          # 타이머 화면
│   ├── choice_widget.py         # 선택 화면
│   ├── break_widget.py          # 화장실/산책 화면
│   └── stretch_widget.py        # 스트레칭 가이드 화면
│
└── resources/                   # 리소스 파일
    ├── images/                  # 이미지 폴더
    │   ├── icon.png             # 프로그램 아이콘
    │   ├── break_walk.png
    │   └── [스트레칭 이미지들]
    └── styles/
        └── main.qss             # Qt 스타일시트
```

---

## 핵심 개념

### 1. PyQt5 시그널/슬롯 (Signal/Slot)

**개념:**
- 시그널: 이벤트 발생을 알리는 신호
- 슬롯: 시그널을 받아 실행되는 함수

**예시:**
```python
# 시그널 정의
class TimerController(QObject):
    tick = pyqtSignal(int)  # int 타입을 전달하는 시그널
    finished = pyqtSignal()  # 파라미터 없는 시그널

# 시그널 발생
self.tick.emit(remaining_time)

# 슬롯 연결
timer.tick.connect(self.update_display)
timer.finished.connect(self.on_timer_finished)
```

**장점:**
- 느슨한 결합 (Loose Coupling)
- 컴포넌트 간 통신이 쉬움
- 이벤트 기반 프로그래밍

---

### 2. QTimer

**개념:**
일정 간격마다 이벤트를 발생시키는 타이머

**사용법:**
```python
# 타이머 생성
self.timer = QTimer()
self.timer.setInterval(1000)  # 1000ms = 1초
self.timer.timeout.connect(self.on_tick)  # 매 초마다 on_tick 호출

# 시작/정지
self.timer.start()
self.timer.stop()
```

---

### 3. QStackedWidget

**개념:**
여러 위젯을 겹쳐놓고 하나씩 보여주는 컨테이너 (화면 전환)

**사용법:**
```python
stacked = QStackedWidget()
stacked.addWidget(timer_widget)    # index 0
stacked.addWidget(choice_widget)   # index 1
stacked.addWidget(stretch_widget)  # index 2

# 화면 전환
stacked.setCurrentIndex(1)  # choice_widget 표시
```

---

### 4. QSystemTrayIcon

**개념:**
윈도우 작업표시줄 알림 영역에 아이콘 표시

**사용법:**
```python
# 트레이 아이콘 생성
tray_icon = QSystemTrayIcon(self)
tray_icon.setIcon(QIcon('icon.png'))

# 메뉴 추가
menu = QMenu()
menu.addAction('열기', self.show_window)
menu.addAction('종료', self.quit)
tray_icon.setContextMenu(menu)

# 표시
tray_icon.show()
```

---

## 파일별 상세 설명

### 1. `main.py` - 애플리케이션 진입점

**역할:**
- QApplication 생성
- 스타일시트 로드
- MainWindow 생성 및 표시

**주요 코드:**
```python
from utils import resource_path

def main():
    app = QApplication(sys.argv)

    # 스타일시트 로드 (PyInstaller 호환)
    qss_path = resource_path('resources/styles/main.qss')
    with open(qss_path, 'r', encoding='utf-8') as f:
        app.setStyleSheet(f.read())

    window = MainWindow()
    window.show()

    sys.exit(app.exec_())
```

**학습 포인트:**
- `QApplication`: 모든 PyQt5 앱의 시작점
- `app.setStyleSheet()`: 전역 스타일 적용
- `app.exec_()`: 이벤트 루프 시작

---

### 2. `utils.py` - 리소스 경로 헬퍼

**역할:**
PyInstaller 빌드 시에도 리소스 파일을 올바르게 찾도록 지원

**주요 코드:**
```python
def resource_path(relative_path):
    try:
        # PyInstaller 실행 시: 임시 폴더 경로
        base_path = sys._MEIPASS
    except Exception:
        # 일반 실행 시: 현재 디렉토리
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)
```

**학습 포인트:**
- `sys._MEIPASS`: PyInstaller가 설정하는 임시 폴더 경로
- 개발/배포 환경 모두 대응

---

### 3. `core/timer.py` - 타이머 컨트롤러

**역할:**
타이머 로직을 담당하는 핵심 클래스

**주요 코드:**
```python
class TimerController(QObject):
    tick = pyqtSignal(int)      # 매 초마다 남은 시간 전달
    finished = pyqtSignal()     # 타이머 완료 시그널

    def __init__(self, duration=1800):
        super().__init__()
        self.duration = duration      # 전체 시간
        self.remaining = duration     # 남은 시간
        self.is_running = False       # 실행 상태

        self.timer = QTimer()
        self.timer.timeout.connect(self._on_tick)
        self.timer.setInterval(1000)  # 1초

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.timer.start()

    def pause(self):
        if self.is_running:
            self.is_running = False
            self.timer.stop()

    def reset(self):
        self.timer.stop()
        self.is_running = False
        self.remaining = self.duration
        self.tick.emit(self.remaining)

    def _on_tick(self):
        self.remaining -= 1
        self.tick.emit(self.remaining)

        if self.remaining <= 0:
            self.timer.stop()
            self.is_running = False
            self.finished.emit()
```

**학습 포인트:**
- `QObject` 상속: 시그널 사용을 위해 필수
- `_on_tick()`: private 메서드 (언더스코어)
- 상태 관리: `is_running`, `remaining`

---

### 4. `core/sequence.py` - 스트레칭 시퀀스 데이터

**역할:**
스트레칭 단계별 데이터 정의

**주요 코드:**
```python
STRETCH_SEQUENCE = [
    {
        'duration': 5,
        'message': '잠시 후 스트레칭을 시작합니다',
        'image': 'prepare.png'
    },
    # ... 7단계
]

TOTAL_STRETCH_TIME = sum(step['duration'] for step in STRETCH_SEQUENCE)
```

**학습 포인트:**
- 데이터와 로직 분리
- 리스트 컴프리헨션 활용
- 설정 데이터를 별도 파일로 관리

---

### 5. `ui/main_window.py` - 메인 윈도우

**역할:**
- 화면 전환 관리
- 시스템 트레이 구현
- 위젯 간 시그널 연결

**핵심 구조:**
```python
class MainWindow(QMainWindow):
    def __init__(self):
        # 윈도우 설정
        self.setWindowTitle('목 건강 지킴이')
        self.setWindowIcon(QIcon(resource_path('resources/images/icon.png')))

        # 스택 위젯 (화면 전환)
        self.stacked_widget = QStackedWidget()

        # 위젯 추가
        self.timer_widget = TimerWidget()
        self.choice_widget = ChoiceWidget()
        self.break_widget = BreakWidget()
        self.stretch_widget = StretchWidget()

        self.stacked_widget.addWidget(self.timer_widget)
        self.stacked_widget.addWidget(self.choice_widget)
        self.stacked_widget.addWidget(self.break_widget)
        self.stacked_widget.addWidget(self.stretch_widget)

        # 시그널 연결
        self.timer_widget.timer_finished.connect(self.show_choice_screen)
        self.choice_widget.skip_clicked.connect(self.on_skip)
        # ...

        # 시스템 트레이 설정
        self.setup_tray_icon()
```

**시스템 트레이 구현:**
```python
def setup_tray_icon(self):
    self.tray_icon = QSystemTrayIcon(self)
    self.tray_icon.setIcon(QIcon(resource_path('resources/images/icon.png')))

    # 메뉴 생성
    tray_menu = QMenu()
    tray_menu.addAction('열기', self.show_window)
    tray_menu.addAction('종료', self.quit_application)

    self.tray_icon.setContextMenu(tray_menu)
    self.tray_icon.activated.connect(self.on_tray_icon_activated)
    self.tray_icon.show()
```

**창 닫기 오버라이드:**
```python
def closeEvent(self, event):
    event.ignore()  # 창 닫기 무시
    self.hide()     # 트레이로 숨김
    self.tray_icon.showMessage('목 건강 지킴이', '트레이에서 실행 중')
```

**학습 포인트:**
- `closeEvent()`: 창 닫기 이벤트 오버라이드
- `event.ignore()`: 기본 동작 무시
- 시스템 트레이로 백그라운드 실행

---

### 6. `ui/timer_widget.py` - 타이머 화면

**역할:**
타이머 UI 표시 및 사용자 입력 처리

**주요 코드:**
```python
class TimerWidget(QWidget):
    timer_finished = pyqtSignal()  # 외부로 전달할 시그널

    def __init__(self):
        super().__init__()
        self.setup_ui()

        # 타이머 컨트롤러 생성
        self.timer = TimerController(duration=1800)
        self.timer.tick.connect(self.update_display)
        self.timer.finished.connect(self.on_timer_finished)

    def setup_ui(self):
        layout = QVBoxLayout(self)

        # 타이머 디스플레이
        self.time_label = QLabel('30:00')
        self.time_label.setObjectName('timerDisplay')

        # 버튼
        self.play_pause_btn = QPushButton('시작하기')
        self.play_pause_btn.clicked.connect(self.toggle_timer)

        layout.addWidget(self.time_label)
        layout.addWidget(self.play_pause_btn)

    def toggle_timer(self):
        if self.timer.is_running:
            self.timer.pause()
            self.play_pause_btn.setText('재생')
        else:
            self.timer.start()
            self.play_pause_btn.setText('일시정지')

    def update_display(self, remaining):
        minutes = remaining // 60
        seconds = remaining % 60
        self.time_label.setText(f'{minutes:02d}:{seconds:02d}')
```

**학습 포인트:**
- `setObjectName()`: QSS 스타일링을 위한 ID 설정
- `f-string` 포맷팅: `{minutes:02d}` (2자리, 0 패딩)
- 시그널 체이닝: `timer.finished` → `self.timer_finished`

---

### 7. `ui/stretch_widget.py` - 스트레칭 가이드

**역할:**
7단계 스트레칭 시퀀스 자동 진행

**주요 코드:**
```python
class StretchWidget(QWidget):
    sequence_finished = pyqtSignal()

    def __init__(self):
        self.current_step = 0      # 현재 단계
        self.step_remaining = 0    # 현재 단계 남은 시간

        self.step_timer = QTimer()
        self.step_timer.timeout.connect(self.on_step_tick)
        self.step_timer.setInterval(1000)

    def start_sequence(self):
        self.current_step = 0
        self.load_current_step()
        self.step_timer.start()

    def load_current_step(self):
        # 모든 단계 완료 확인
        if self.current_step >= len(STRETCH_SEQUENCE):
            self.step_timer.stop()
            self.sequence_finished.emit()
            return

        # 현재 단계 데이터 로드
        step = STRETCH_SEQUENCE[self.current_step]
        self.step_remaining = step['duration']

        # 이미지 로드
        image_path = resource_path(f"resources/images/{step['image']}")
        pixmap = QPixmap(image_path)
        self.image_label.setPixmap(
            pixmap.scaled(600, 400, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        )

        # 자막 설정
        self.message_label.setText(step['message'])
        self.update_timer_display()

    def on_step_tick(self):
        self.step_remaining -= 1
        self.update_timer_display()

        # 현재 단계 완료 시 다음 단계로
        if self.step_remaining <= 0:
            self.current_step += 1
            self.load_current_step()
```

**학습 포인트:**
- 상태 머신 패턴: 단계별 진행
- `QPixmap`: 이미지 로딩 및 크기 조정
- `Qt.KeepAspectRatio`: 비율 유지 리사이징

---

## 코드 흐름 분석

### 1. 프로그램 시작

```
main.py
  └─> QApplication 생성
  └─> 스타일시트 로드
  └─> MainWindow 생성
       └─> TimerWidget, ChoiceWidget 등 생성
       └─> 시스템 트레이 설정
       └─> 시그널 연결
  └─> window.show()
  └─> app.exec_() (이벤트 루프 시작)
```

---

### 2. 타이머 동작 흐름

```
사용자: "시작하기" 클릭
  └─> toggle_timer() 호출
       └─> timer.start()
            └─> QTimer 시작 (1초마다 timeout)
                 └─> _on_tick() 호출
                      └─> remaining -= 1
                      └─> tick.emit(remaining)
                           └─> update_display(remaining)
                                └─> 화면에 시간 표시

30분 후: remaining == 0
  └─> finished.emit()
       └─> on_timer_finished()
            └─> timer_finished.emit()
                 └─> show_choice_screen()
                      └─> 화면 전환 + 창 표시
```

---

### 3. 화면 전환 흐름

```
타이머 완료
  └─> show_choice_screen()
       └─> stacked_widget.setCurrentIndex(1)  # ChoiceWidget

선택:
  ├─> "나중에 하기" 클릭
  │    └─> on_skip()
  │         └─> timer.reset()
  │         └─> timer.start()
  │         └─> setCurrentIndex(0)  # TimerWidget
  │
  ├─> "스트레칭 시작" 클릭
  │    └─> on_stretch()
  │         └─> stretch_widget.start_sequence()
  │         └─> setCurrentIndex(3)  # StretchWidget
  │
  └─> "화장실/산책" 클릭
       └─> on_break()
            └─> break_widget.start()
            └─> setCurrentIndex(2)  # BreakWidget
```

---

## 주요 기능 구현

### 1. 자동으로 창 띄우기

**문제:**
백그라운드 실행 중 타이머 완료 시 창을 자동으로 띄우기

**해결:**
```python
def show_choice_screen(self):
    self.stacked_widget.setCurrentIndex(1)
    self.show_window()  # 창 표시
    self.tray_icon.showMessage('목 건강 지킴이', '스트레칭 시간입니다!')

def show_window(self):
    self.show()           # 창 보이기
    self.raise_()         # 창을 최상위로
    self.activateWindow() # 창 활성화
```

---

### 2. 리소스 파일 경로 처리

**문제:**
PyInstaller 빌드 시 리소스 파일을 찾지 못함

**해결:**
```python
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS  # PyInstaller 임시 폴더
    except:
        base_path = os.path.abspath(".")  # 개발 환경
    return os.path.join(base_path, relative_path)
```

**빌드 시 리소스 포함:**
```bash
pyinstaller --add-data "resources;resources" main.py
```

---

### 3. QSS 스타일링

**개념:**
CSS와 유사한 Qt 스타일시트

**예시:**
```css
/* ID로 선택 */
#timerDisplay {
    font-size: 120px;
    color: #5A5A5A;
}

/* 클래스로 선택 */
QPushButton {
    background-color: #A8C5A0;
    border-radius: 30px;
}

/* 상태 선택자 */
QPushButton:hover {
    background-color: #96B38E;
}
```

**적용:**
```python
# 전역 스타일
app.setStyleSheet(qss_content)

# 개별 위젯 ID 설정
widget.setObjectName('timerDisplay')
```

---

## 빌드 프로세스

### 1. PyInstaller 동작 원리

```
Python 스크립트
  └─> PyInstaller 분석
       ├─> 의존성 모듈 수집
       ├─> 리소스 파일 수집
       └─> 단일 실행 파일 생성
            └─> 실행 시 임시 폴더에 압축 해제
            └─> Python 인터프리터 포함
```

---

### 2. 빌드 옵션

```bash
pyinstaller \
  --onefile \              # 단일 파일로 생성
  --windowed \             # 콘솔 창 숨김
  --icon=icon.ico \        # 아이콘 설정
  --add-data "resources;resources" \  # 리소스 포함
  --name="목건강지킴이" \   # 파일명
  main.py
```

---

### 3. 자동 빌드 스크립트

**build_exe.py 구조:**
```python
1. PNG → ICO 변환 (Pillow)
2. PyInstaller 명령 생성
3. 실행
4. 결과 안내
```

---

## 확장 가능성

### 1. 기능 추가 아이디어

**설정 기능:**
```python
# settings.py
class Settings:
    timer_duration = 1800  # 30분
    sound_enabled = True
    auto_start = True
```

**통계 기능:**
```python
# stats.py
class Statistics:
    total_stretches = 0
    total_time = 0

    def save_to_file(self):
        with open('stats.json', 'w') as f:
            json.dump(self.__dict__, f)
```

**사운드 알림:**
```python
from PyQt5.QtMultimedia import QSound

QSound.play('resources/sounds/notification.wav')
```

---

### 2. 코드 개선 방향

**1. MVC 패턴 적용**
```
Model (데이터) ─── Controller (로직) ─── View (UI)
```

**2. 설정 파일 분리**
```python
# config.json
{
    "timer_duration": 1800,
    "language": "ko",
    "theme": "light"
}
```

**3. 단위 테스트 추가**
```python
# tests/test_timer.py
def test_timer_countdown():
    timer = TimerController(duration=10)
    timer.start()
    # assert ...
```

---

### 3. 멀티플랫폼 지원

**Windows:**
- PyInstaller로 EXE 생성
- 시작 프로그램 등록

**macOS:**
```bash
pyinstaller --onefile --windowed --icon=icon.icns main.py
```

**Linux:**
```bash
pyinstaller --onefile main.py
```

---

## 학습 체크리스트

### PyQt5 기초
- [ ] QApplication, QWidget, QMainWindow 이해
- [ ] 레이아웃 시스템 (QVBoxLayout, QHBoxLayout)
- [ ] 시그널/슬롯 메커니즘
- [ ] QTimer 사용법

### 중급
- [ ] QStackedWidget으로 화면 전환
- [ ] QSystemTrayIcon으로 백그라운드 실행
- [ ] QSS 스타일링
- [ ] 이벤트 오버라이드 (closeEvent)

### 고급
- [ ] PyInstaller 빌드 프로세스
- [ ] 리소스 경로 관리
- [ ] 시그널 체이닝
- [ ] 상태 관리 패턴

---

## 참고 자료

### 공식 문서
- [PyQt5 Documentation](https://www.riverbankcomputing.com/static/Docs/PyQt5/)
- [Qt Documentation](https://doc.qt.io/)
- [Python 공식 문서](https://docs.python.org/3/)

### 추천 학습 자료
- Qt for Python (PySide6) - PyQt5와 유사
- "Rapid GUI Programming with Python and Qt" 책
- PyQt5 Tutorial 시리즈

---

## 마치며

이 프로젝트는 다음을 학습할 수 있습니다:

1. **GUI 프로그래밍 기초**
   - 이벤트 기반 프로그래밍
   - 컴포넌트 간 통신
   - 상태 관리

2. **실전 개발 경험**
   - 프로젝트 구조화
   - 코드 분리 (UI/로직/데이터)
   - 배포 프로세스

3. **PyQt5 핵심 개념**
   - 위젯 시스템
   - 시그널/슬롯
   - 스타일링

**다음 단계:**
- 기능 추가해보기
- 코드 리팩토링
- 테스트 코드 작성
- 다른 PyQt5 프로젝트 시도

---

**Happy Coding! 🚀**
