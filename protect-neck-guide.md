# 🏥 Protect Neck - 개발 가이드

## 📚 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [프로젝트 구조](#프로젝트-구조)
3. [환경 설정](#환경-설정)
4. [핵심 컴포넌트 설명](#핵심-컴포넌트-설명)
5. [화면별 구현 가이드](#화면별-구현-가이드)
6. [스타일시트 (QSS) 가이드](#스타일시트-qss-가이드)
7. [실행 방법](#실행-방법)

---

## 프로젝트 개요

**목적**: 30분마다 목/어깨 스트레칭을 유도하여 거북목 예방  
**기술 스택**: Python 3.10 + PyQt5  
**주요 기능**:
- 30분 타이머 (일시정지/재생 기능)
- 스트레칭 가이드 (7단계, 이미지 + 타이머 + 자막)
- 화장실/산책 모드
- 모던한 건강 앱 UI

---

## 프로젝트 구조

```
protect-neck/
├── main.py                     # 애플리케이션 진입점
├── requirements.txt            # 의존성 목록
│
├── ui/                         # UI 컴포넌트
│   ├── __init__.py
│   ├── main_window.py         # 메인 윈도우 (탭 관리)
│   ├── timer_widget.py        # 타이머 화면
│   ├── choice_widget.py       # 선택 화면 (스킵/스트레칭/산책)
│   ├── break_widget.py        # 화장실/산책 화면
│   └── stretch_widget.py      # 스트레칭 가이드 화면
│
├── core/                       # 비즈니스 로직
│   ├── __init__.py
│   ├── timer.py               # 타이머 로직 클래스
│   └── sequence.py            # 스트레칭 시퀀스 데이터
│
└── resources/                  # 리소스 파일
    ├── images/                # 이미지 폴더
    │   ├── break_walk.png     # 화장실/산책
    │   ├── prepare.png        # 준비
    │   ├── warmup.png         # 워밍업
    │   ├── chest_open.png     # 가슴 펴기
    │   ├── chin_tuck.png      # 턱 당기기
    │   ├── neck_strengthen.png # 뒷목 강화
    │   ├── full_stretch.png   # 전신 스트레칭
    │   └── free_stretch.png   # 자유 스트레칭
    │
    └── styles/
        └── main.qss           # Qt 스타일시트
```

---

## 환경 설정

### 1. Python 가상환경 생성 및 활성화

```bash
# Python 3.10으로 가상환경 생성
py -3.10 -m venv venv

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 2. 이미지 준비

`resources/images/` 폴더에 AI로 생성한 이미지를 다음 이름으로 저장:
- `break_walk.png`
- `prepare.png`
- `warmup.png`
- `chest_open.png`
- `chin_tuck.png`
- `neck_strengthen.png`
- `full_stretch.png`
- `free_stretch.png`

**이미지 권장 사이즈**: 600x400px

---

## 핵심 컴포넌트 설명

### 1. `main.py` - 애플리케이션 진입점

```python
import sys
from PyQt5.QtWidgets import QApplication
from ui.main_window import MainWindow

def main():
    app = QApplication(sys.argv)
    
    # 애플리케이션 전체 스타일시트 로드
    with open('resources/styles/main.qss', 'r', encoding='utf-8') as f:
        app.setStyleSheet(f.read())
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
```

**역할**:
- QApplication 초기화
- 전역 스타일시트 적용
- 메인 윈도우 생성 및 표시

---

### 2. `core/timer.py` - 타이머 로직

```python
from PyQt5.QtCore import QObject, QTimer, pyqtSignal

class TimerController(QObject):
    """타이머 컨트롤러"""
    
    # 시그널 정의
    tick = pyqtSignal(int)  # 매 초마다 남은 시간 전달
    finished = pyqtSignal()  # 타이머 완료 시그널
    
    def __init__(self, duration=1800):  # 기본 30분
        super().__init__()
        self.duration = duration
        self.remaining = duration
        self.is_running = False
        
        # QTimer 설정 (1초마다 업데이트)
        self.timer = QTimer()
        self.timer.timeout.connect(self._on_tick)
        self.timer.setInterval(1000)
    
    def start(self):
        """타이머 시작"""
        if not self.is_running:
            self.is_running = True
            self.timer.start()
    
    def pause(self):
        """타이머 일시정지"""
        if self.is_running:
            self.is_running = False
            self.timer.stop()
    
    def reset(self):
        """타이머 리셋"""
        self.timer.stop()
        self.is_running = False
        self.remaining = self.duration
        self.tick.emit(self.remaining)
    
    def _on_tick(self):
        """1초마다 호출"""
        self.remaining -= 1
        self.tick.emit(self.remaining)
        
        if self.remaining <= 0:
            self.timer.stop()
            self.is_running = False
            self.finished.emit()
    
    def get_remaining_time(self):
        """남은 시간 반환 (초)"""
        return self.remaining
```

**주요 기능**:
- `start()`: 타이머 시작
- `pause()`: 일시정지
- `reset()`: 초기화
- `tick` 시그널: 매 초마다 남은 시간 전달
- `finished` 시그널: 타이머 완료 알림

---

### 3. `core/sequence.py` - 스트레칭 시퀀스 데이터

```python
# 스트레칭 시퀀스 정의
STRETCH_SEQUENCE = [
    {
        'duration': 5,
        'message': '잠시 후 스트레칭을 시작합니다',
        'image': 'prepare.png'
    },
    {
        'duration': 30,
        'message': '자리에서 일어나 가볍게 목과 어깨를 풀어주세요',
        'image': 'warmup.png'
    },
    {
        'duration': 15,
        'message': '어깨를 뒤로 당기고 목을 젖혀 가슴을 활짝 펴주세요',
        'image': 'chest_open.png'
    },
    {
        'duration': 15,
        'message': '턱을 목 쪽으로 천천히 당겨주세요 (10회 반복)',
        'image': 'chin_tuck.png'
    },
    {
        'duration': 10,
        'message': '뒤통수를 손으로 밀며 뒷목 근육을 강화해주세요',
        'image': 'neck_strengthen.png'
    },
    {
        'duration': 10,
        'message': '턱을 당기고 두 팔을 뒤로 쭉 펴서 기지개를 켜주세요',
        'image': 'full_stretch.png'
    },
    {
        'duration': 20,
        'message': '목 마사지나 어깨 돌리기 등 자유롭게 스트레칭하세요',
        'image': 'free_stretch.png'
    }
]

# 총 시퀀스 시간 계산
TOTAL_STRETCH_TIME = sum(step['duration'] for step in STRETCH_SEQUENCE)  # 105초
```

**구조**:
- `duration`: 각 단계별 시간 (초)
- `message`: 화면에 표시할 자막
- `image`: 표시할 이미지 파일명

---

## 화면별 구현 가이드

### 1. `ui/main_window.py` - 메인 윈도우

```python
from PyQt5.QtWidgets import QMainWindow, QTabWidget, QWidget, QVBoxLayout
from PyQt5.QtCore import Qt
from .timer_widget import TimerWidget
from .choice_widget import ChoiceWidget
from .break_widget import BreakWidget
from .stretch_widget import StretchWidget

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle('목 건강 지킴이')
        self.setMinimumSize(800, 600)
        
        # 중앙 위젯 설정
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # 메인 레이아웃
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # 탭 위젯 생성
        self.tabs = QTabWidget()
        self.tabs.setObjectName('mainTabs')
        layout.addWidget(self.tabs)
        
        # 타이머 탭
        self.timer_widget = TimerWidget()
        self.tabs.addTab(self.timer_widget, '타이머')
        
        # 설정 탭 (향후 구현)
        settings_widget = QWidget()
        self.tabs.addTab(settings_widget, '설정')
        
        # 통계 탭 (향후 구현)
        stats_widget = QWidget()
        self.tabs.addTab(stats_widget, '통계')
        
        # 시그널 연결
        self.timer_widget.timer_finished.connect(self.show_choice_screen)
    
    def show_choice_screen(self):
        """타이머 완료 시 선택 화면 표시"""
        # ChoiceWidget을 타이머 위젯 위에 표시하는 로직
        pass
```

**주요 역할**:
- 탭 구조 관리 (타이머/설정/통계)
- 화면 전환 로직
- 전체 윈도우 레이아웃

---

### 2. `ui/timer_widget.py` - 타이머 화면

```python
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton
from PyQt5.QtCore import Qt, pyqtSignal
from core.timer import TimerController

class TimerWidget(QWidget):
    timer_finished = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.setup_ui()
        
        # 타이머 컨트롤러 생성
        self.timer = TimerController(duration=1800)  # 30분
        self.timer.tick.connect(self.update_display)
        self.timer.finished.connect(self.on_timer_finished)
    
    def setup_ui(self):
        """UI 초기화"""
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        
        # 타이머 디스플레이
        self.time_label = QLabel('30:00')
        self.time_label.setObjectName('timerDisplay')
        self.time_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.time_label)
        
        # 일시정지/재생 버튼
        self.play_pause_btn = QPushButton('시작하기')
        self.play_pause_btn.setObjectName('playPauseButton')
        self.play_pause_btn.clicked.connect(self.toggle_timer)
        layout.addWidget(self.play_pause_btn)
    
    def toggle_timer(self):
        """타이머 시작/일시정지 토글"""
        if self.timer.is_running:
            self.timer.pause()
            self.play_pause_btn.setText('▶️ 재생')
        else:
            self.timer.start()
            self.play_pause_btn.setText('⏸️ 일시정지')
    
    def update_display(self, remaining):
        """타이머 디스플레이 업데이트"""
        minutes = remaining // 60
        seconds = remaining % 60
        self.time_label.setText(f'{minutes:02d}:{seconds:02d}')
    
    def on_timer_finished(self):
        """타이머 완료 시"""
        self.timer_finished.emit()
```

**핵심 기능**:
- 타이머 디스플레이 (분:초 형식)
- 일시정지/재생 토글 버튼
- 시그널을 통한 타이머 완료 알림

---

### 3. `ui/choice_widget.py` - 선택 화면

```python
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton
from PyQt5.QtCore import Qt, pyqtSignal

class ChoiceWidget(QWidget):
    skip_clicked = pyqtSignal()
    stretch_clicked = pyqtSignal()
    break_clicked = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.setup_ui()
    
    def setup_ui(self):
        """UI 초기화"""
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(20)
        
        # 메시지
        message = QLabel('30분이 지났습니다! 🎉')
        message.setObjectName('choiceMessage')
        message.setAlignment(Qt.AlignCenter)
        layout.addWidget(message)
        
        # 스킵 버튼
        skip_btn = QPushButton('나중에 하기')
        skip_btn.setObjectName('skipButton')
        skip_btn.clicked.connect(self.skip_clicked.emit)
        layout.addWidget(skip_btn)
        
        # 스트레칭 버튼
        stretch_btn = QPushButton('스트레칭 시작')
        stretch_btn.setObjectName('stretchButton')
        stretch_btn.clicked.connect(self.stretch_clicked.emit)
        layout.addWidget(stretch_btn)
        
        # 화장실/산책 버튼
        break_btn = QPushButton('화장실/산책 🚶')
        break_btn.setObjectName('breakButton')
        break_btn.clicked.connect(self.break_clicked.emit)
        layout.addWidget(break_btn)
```

**핵심 기능**:
- 세 가지 선택지 제공
- 각 버튼 클릭 시 시그널 발생

---

### 4. `ui/break_widget.py` - 화장실/산책 화면

```python
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton
from PyQt5.QtCore import Qt, QTimer, pyqtSignal
from PyQt5.QtGui import QPixmap

class BreakWidget(QWidget):
    return_clicked = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.elapsed_seconds = 0
        self.setup_ui()
        
        # 경과 시간 타이머 (카운트업)
        self.elapsed_timer = QTimer()
        self.elapsed_timer.timeout.connect(self.update_elapsed)
        self.elapsed_timer.setInterval(1000)
    
    def setup_ui(self):
        """UI 초기화"""
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(20)
        
        # 이미지
        self.image_label = QLabel()
        self.image_label.setObjectName('breakImage')
        pixmap = QPixmap('resources/images/break_walk.png')
        self.image_label.setPixmap(pixmap.scaled(600, 400, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        layout.addWidget(self.image_label, alignment=Qt.AlignCenter)
        
        # 경과 시간 타이머
        self.elapsed_label = QLabel('00:00')
        self.elapsed_label.setObjectName('elapsedTimer')
        self.elapsed_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.elapsed_label)
        
        # 복귀 버튼
        return_btn = QPushButton('복귀하기 🏃')
        return_btn.setObjectName('returnButton')
        return_btn.clicked.connect(self.on_return_clicked)
        layout.addWidget(return_btn)
    
    def start(self):
        """화면 표시 시 시작"""
        self.elapsed_seconds = 0
        self.elapsed_timer.start()
        self.update_elapsed()
    
    def update_elapsed(self):
        """경과 시간 업데이트"""
        self.elapsed_seconds += 1
        minutes = self.elapsed_seconds // 60
        seconds = self.elapsed_seconds % 60
        self.elapsed_label.setText(f'{minutes:02d}:{seconds:02d}')
    
    def on_return_clicked(self):
        """복귀 버튼 클릭"""
        self.elapsed_timer.stop()
        self.return_clicked.emit()
```

**핵심 기능**:
- 경과 시간 카운트업 타이머
- 화장실/산책 이미지 표시
- 복귀 버튼으로 타이머 모드 복귀

---

### 5. `ui/stretch_widget.py` - 스트레칭 가이드 화면

```python
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel
from PyQt5.QtCore import Qt, QTimer, pyqtSignal
from PyQt5.QtGui import QPixmap
from core.sequence import STRETCH_SEQUENCE

class StretchWidget(QWidget):
    sequence_finished = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.current_step = 0
        self.step_remaining = 0
        self.setup_ui()
        
        # 단계별 타이머
        self.step_timer = QTimer()
        self.step_timer.timeout.connect(self.on_step_tick)
        self.step_timer.setInterval(1000)
    
    def setup_ui(self):
        """UI 초기화"""
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(20)
        
        # 이미지
        self.image_label = QLabel()
        self.image_label.setObjectName('stretchImage')
        layout.addWidget(self.image_label, alignment=Qt.AlignCenter)
        
        # 타이머
        self.timer_label = QLabel('00:00')
        self.timer_label.setObjectName('stretchTimer')
        self.timer_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.timer_label)
        
        # 자막
        self.message_label = QLabel()
        self.message_label.setObjectName('stretchMessage')
        self.message_label.setAlignment(Qt.AlignCenter)
        self.message_label.setWordWrap(True)
        layout.addWidget(self.message_label)
    
    def start_sequence(self):
        """스트레칭 시퀀스 시작"""
        self.current_step = 0
        self.load_current_step()
        self.step_timer.start()
    
    def load_current_step(self):
        """현재 단계 로드"""
        if self.current_step >= len(STRETCH_SEQUENCE):
            self.step_timer.stop()
            self.sequence_finished.emit()
            return
        
        step = STRETCH_SEQUENCE[self.current_step]
        self.step_remaining = step['duration']
        
        # 이미지 로드
        pixmap = QPixmap(f"resources/images/{step['image']}")
        self.image_label.setPixmap(pixmap.scaled(600, 400, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        
        # 자막 설정
        self.message_label.setText(step['message'])
        
        # 타이머 표시 업데이트
        self.update_timer_display()
    
    def on_step_tick(self):
        """1초마다 호출"""
        self.step_remaining -= 1
        self.update_timer_display()
        
        if self.step_remaining <= 0:
            self.current_step += 1
            self.load_current_step()
    
    def update_timer_display(self):
        """타이머 디스플레이 업데이트"""
        minutes = self.step_remaining // 60
        seconds = self.step_remaining % 60
        self.timer_label.setText(f'{minutes:02d}:{seconds:02d}')
```

**핵심 기능**:
- 7단계 스트레칭 시퀀스 자동 진행
- 각 단계마다 이미지, 타이머, 자막 표시
- 시퀀스 완료 시 시그널 발생

---

## 스타일시트 (QSS) 가이드

### `resources/styles/main.qss`

```css
/* 전체 배경 */
QWidget {
    background-color: #F5F1E8;
    font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
    color: #3D3D3D;
}

/* 메인 탭 */
QTabWidget::pane {
    border: none;
    background-color: #F5F1E8;
}

QTabBar::tab {
    background-color: #E8DCC4;
    color: #3D3D3D;
    padding: 12px 24px;
    margin-right: 4px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
}

QTabBar::tab:selected {
    background-color: #F5F1E8;
    font-weight: bold;
}

/* 타이머 디스플레이 */
#timerDisplay {
    font-size: 120px;
    font-family: 'Consolas', 'Courier New', monospace;
    color: #5A5A5A;
    font-weight: 300;
}

/* 일시정지/재생 버튼 */
#playPauseButton {
    background-color: #A8C5A0;
    color: white;
    font-size: 18px;
    font-weight: bold;
    padding: 15px 40px;
    border: none;
    border-radius: 30px;
    min-width: 200px;
    min-height: 60px;
}

#playPauseButton:hover {
    background-color: #96B38E;
}

#playPauseButton:pressed {
    background-color: #89A582;
}

/* 선택 화면 메시지 */
#choiceMessage {
    font-size: 32px;
    font-weight: bold;
    color: #3D3D3D;
    margin-bottom: 20px;
}

/* 스킵 버튼 */
#skipButton {
    background-color: #E0E0E0;
    color: #5A5A5A;
    font-size: 16px;
    padding: 12px 30px;
    border: none;
    border-radius: 20px;
    min-width: 250px;
    min-height: 50px;
}

#skipButton:hover {
    background-color: #D0D0D0;
}

/* 스트레칭 버튼 */
#stretchButton {
    background-color: #A8C5A0;
    color: white;
    font-size: 18px;
    font-weight: bold;
    padding: 15px 30px;
    border: none;
    border-radius: 20px;
    min-width: 250px;
    min-height: 50px;
}

#stretchButton:hover {
    background-color: #96B38E;
}

/* 화장실/산책 버튼 */
#breakButton {
    background-color: #9DB4C0;
    color: white;
    font-size: 16px;
    font-weight: bold;
    padding: 12px 30px;
    border: none;
    border-radius: 20px;
    min-width: 250px;
    min-height: 50px;
}

#breakButton:hover {
    background-color: #8BA3AF;
}

/* 복귀 버튼 */
#returnButton {
    background-color: #A8C5A0;
    color: white;
    font-size: 16px;
    font-weight: bold;
    padding: 12px 30px;
    border: none;
    border-radius: 20px;
    min-width: 180px;
    min-height: 50px;
}

#returnButton:hover {
    background-color: #96B38E;
}

/* 경과 시간 타이머 */
#elapsedTimer {
    font-size: 40px;
    font-family: 'Consolas', 'Courier New', monospace;
    color: #7A7A7A;
    font-weight: 300;
}

/* 스트레칭 이미지 */
#stretchImage, #breakImage {
    border-radius: 16px;
    background-color: white;
    padding: 10px;
}

/* 스트레칭 타이머 */
#stretchTimer {
    font-size: 40px;
    font-family: 'Consolas', 'Courier New', monospace;
    color: #7A7A7A;
    font-weight: 300;
}

/* 스트레칭 자막 */
#stretchMessage {
    font-size: 28px;
    color: #3D3D3D;
    padding: 0 40px;
    line-height: 1.4;
}
```

**주요 스타일링 포인트**:
- 아이보리/베이지 배경 (#F5F1E8)
- 둥근 모서리 (border-radius)
- 부드러운 호버 효과
- 건강 앱 느낌의 색상 조합

---

## 실행 방법

### 1. 기본 실행

```bash
# 가상환경 활성화
venv\Scripts\activate

# 실행
python main.py
```

### 2. 디버그 모드 실행

`main.py`에 디버그 옵션 추가:

```python
import sys
from PyQt5.QtWidgets import QApplication
from ui.main_window import MainWindow

def main():
    app = QApplication(sys.argv)
    
    # 디버그: 스타일시트 에러 출력
    try:
        with open('resources/styles/main.qss', 'r', encoding='utf-8') as f:
            app.setStyleSheet(f.read())
    except Exception as e:
        print(f'스타일시트 로드 실패: {e}')
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
```

---

## 개발 팁

### 1. 시그널/슬롯 연결 패턴

```python
# 시그널 정의
class MyWidget(QWidget):
    my_signal = pyqtSignal(str)  # 문자열을 전달하는 시그널
    
    def emit_example(self):
        self.my_signal.emit("Hello")

# 슬롯 연결
widget = MyWidget()
widget.my_signal.connect(lambda msg: print(msg))
```

### 2. 화면 전환 패턴

```python
# 스택 위젯을 이용한 화면 전환
from PyQt5.QtWidgets import QStackedWidget

stacked_widget = QStackedWidget()
stacked_widget.addWidget(timer_widget)      # index 0
stacked_widget.addWidget(choice_widget)     # index 1
stacked_widget.addWidget(stretch_widget)    # index 2

# 화면 전환
stacked_widget.setCurrentIndex(1)  # choice_widget으로 전환
```

### 3. 타이머 시간 단축 (테스트용)

```python
# 30분 대신 30초로 테스트
self.timer = TimerController(duration=30)  # 30초

# 스트레칭 각 단계를 1초로 테스트
STRETCH_SEQUENCE = [
    {'duration': 1, 'message': '...', 'image': 'prepare.png'},
    # ...
]
```

---

## 문제 해결

### 1. 이미지가 표시되지 않는 경우

```python
# 절대 경로 사용
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
image_path = os.path.join(BASE_DIR, '..', 'resources', 'images', 'prepare.png')
pixmap = QPixmap(image_path)

# 이미지 로드 확인
if pixmap.isNull():
    print(f"이미지 로드 실패: {image_path}")
```

### 2. 스타일시트가 적용되지 않는 경우

```python
# objectName 확인
widget.setObjectName('timerDisplay')

# QSS에서 정확히 매칭
# #timerDisplay { ... }
```

### 3. 한글 깨짐 문제

```python
# UTF-8 인코딩 명시
with open('resources/styles/main.qss', 'r', encoding='utf-8') as f:
    app.setStyleSheet(f.read())
```

---

## 다음 단계

1. ✅ 기본 구조 구현
2. ✅ 타이머 기능 구현
3. ✅ 화면 전환 로직 구현
4. ✅ 스타일시트 적용
5. 🔲 설정 탭 구현 (타이머 시간 커스터마이징)
6. 🔲 통계 탭 구현 (완료 횟수 기록)
7. 🔲 사운드 알림 추가
8. 🔲 시스템 트레이 아이콘 추가
9. 🔲 exe 파일 빌드 (PyInstaller)

---

## 참고 자료

- [PyQt5 공식 문서](https://www.riverbankcomputing.com/static/Docs/PyQt5/)
- [Qt Style Sheets 레퍼런스](https://doc.qt.io/qt-5/stylesheet-reference.html)
- [Python 시그널/슬롯 가이드](https://realpython.com/python-pyqt-signals-slots/)

---

**Happy Coding! 목 건강 지키면서 개발하세요! 💪**
