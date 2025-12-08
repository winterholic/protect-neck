# 🏥 Protect Neck - 목 건강 지킴이 애플리케이션

## 📋 프로젝트 개요

**목적**: 장시간 작업 시 30분마다 목/어깨 스트레칭을 유도하여 거북목 예방  
**타겟**: 장시간 컴퓨터 작업을 하는 개발자, 직장인(사실 내가 쓰려고 만듬)  
**플랫폼**: Windows Desktop Application  
**개발 스택**: Python + PyQt5/PySide6 (Qt Style Sheets로 모던 UI 구현)

---

## 🎨 디자인 컨셉

### 컬러 팔레트
- **Primary**: `#F5F1E8` (아이보리/베이지)
- **Secondary**: `#E8DCC4` (따뜻한 베이지)
- **Accent**: `#A8C5A0` (부드러운 세이지 그린)
- **Break Mode**: `#9DB4C0` (부드러운 블루)
- **Text Primary**: `#3D3D3D` (차분한 다크 그레이)
- **Text Secondary**: `#7A7A7A` (미디엄 그레이)
- **Timer Text**: `#5A5A5A` (가독성 좋은 그레이)

### 디자인 스타일
- 둥근 모서리 (border-radius: 12-20px)
- 부드러운 그림자 효과
- 미니멀한 건강 앱 느낌
- 타이포그래피: 고딕 계열 (맑은 고딕, Pretendard)

---

## 🖼️ UI 구조

```
┌─────────────────────────────────────────┐
│  [탭1: 타이머] [탭2: 설정] [탭3: 통계]    │ ← 상단 탭바
├─────────────────────────────────────────┤
│                                         │
│                                         │
│          메인 콘텐츠 영역                │
│        (모드에 따라 변경됨)              │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 화면 모드 및 플로우

### 1️⃣ **시작 화면 (Initial Screen)**
**표시 요소**:
- 앱 타이틀: "목 건강 지킴이" (중앙 상단)
- 서브 타이틀: "30분마다 건강한 습관을" (작은 글씨)
- 시작 버튼 (중앙, 크고 둥근 버튼)

**버튼 디자인**:
- 크기: 200x60px
- 텍스트: "시작하기"
- 색상: Accent Green (#A8C5A0)
- 호버 시 약간 어두워짐

---

### 2️⃣ **타이머 모드 (Timer Mode)**
**표시 요소**:
- 타이머 숫자 (중앙, 매우 크게)
  - 포맷: `29:59`
  - 폰트 사이즈: 120px
  - 폰트: 모노스페이스 계열 (Consolas, Roboto Mono)
- 진행 상황 표시 (선택사항)
  - 원형 프로그레스 바 또는 상단 라인 바
- **일시정지/재생 버튼** (타이머 아래)
  - 타이머 동작 중: ⏸️ 일시정지 버튼 표시
  - 타이머 정지 중: ▶️ 재생 버튼 표시
  - 크기: 60x60px (원형)
  - 색상: Accent Green (#A8C5A0)
  - 위치: 타이머 숫자 아래 40px

**동작**:
- 30분(1800초) 카운트다운
- 일시정지/재생 토글 가능
- 30분 완료 시 → **선택 화면**으로 전환

---

### 3️⃣ **선택 화면 (Choice Screen)**
**표시 요소**:
- 메시지: "30분이 지났습니다! 🎉"
- 세 개의 버튼 (세로 또는 2+1 배치)

**버튼 1: 스킵**
- 텍스트: "나중에 하기"
- 색상: 연한 회색 (#E0E0E0)
- 동작: 즉시 타이머 모드로 복귀 (30분 재시작)

**버튼 2: 스트레칭**
- 텍스트: "스트레칭 시작"
- 색상: Accent Green (#A8C5A0)
- 동작: 스트레칭 가이드 모드로 전환

**버튼 3: 화장실/산책**
- 텍스트: "화장실/산책 🚶"
- 색상: 부드러운 블루 (#9DB4C0)
- 동작: 화장실/산책 모드로 전환

---

### 4️⃣ **화장실/산책 모드 (Break Mode)**

**UI 레이아웃**:
```
┌─────────────────────────────────────┐
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │    이미지 영역         │       │ ← 600x400px 사각형
│     │  (화장실/산책 이미지)  │       │
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
│          ⏱️ 03:24                   │ ← 경과 시간 타이머 (40px)
│                                     │
│     ┌─────────────────────┐         │
│     │    복귀하기 🏃       │         │ ← 복귀 버튼
│     └─────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

**구성 요소**:
1. **이미지 영역**: 
   - 크기: 600x400px
   - 화장실 또는 가볍게 산책하는 모습
   - 둥근 모서리, 그림자 효과

2. **경과 시간 타이머**:
   - 크기: 40px
   - 포맷: `00:00`부터 카운트업 (00:01, 00:02...)
   - 스타일: 미니멀, 얇은 폰트
   - 위치: 이미지 아래 20px

3. **복귀 버튼**:
   - 크기: 180x50px
   - 텍스트: "복귀하기" 또는 "돌아가기"
   - 색상: Accent Green (#A8C5A0)
   - 위치: 타이머 아래 30px

**동작**:
- 복귀 버튼 클릭 시 → 즉시 **타이머 모드**로 전환 (30분 재시작)
- 산책/화장실이 자연스러운 스트레칭 효과를 제공한다는 전제

---

### 5️⃣ **스트레칭 가이드 모드 (Stretching Guide Mode)**

**UI 레이아웃**:
```
┌─────────────────────────────────────┐
│                                     │
│     ┌───────────────────────┐       │
│     │                       │       │
│     │    이미지 영역         │       │ ← 600x400px 사각형
│     │   (AI 생성 이미지)     │       │
│     │                       │       │
│     └───────────────────────┘       │
│                                     │
│          ⏱️ 00:05                   │ ← 작은 타이머 (40px)
│                                     │
│      목을 천천히 좌우로 돌려주세요    │ ← 자막 텍스트 (28px)
│                                     │
└─────────────────────────────────────┘
```

**구성 요소**:
1. **이미지 영역**: 
   - 크기: 600x400px
   - 둥근 모서리
   - 그림자 효과
   - 이미지 교체는 각 단계마다 자동

2. **미니 타이머**:
   - 크기: 40px
   - 스타일: 미니멀, 얇은 폰트
   - 위치: 이미지 아래 20px

3. **자막 텍스트**:
   - 크기: 28px
   - 위치: 타이머 아래 15px
   - 색상: Text Primary
   - 가운데 정렬

---

## 🧘 스트레칭 시퀀스

| 단계 | 시간 | 자막 (개선안) | 이미지 키 |
|------|------|--------------|-----------|
| 0 | 5초 | "잠시 후 스트레칭을 시작합니다" | `prepare` |
| 1 | 30초 | "자리에서 일어나 가볍게 목과 어깨를 풀어주세요" | `warmup` |
| 2 | 15초 | "어깨를 뒤로 당기고 목을 젖혀 가슴을 활짝 펴주세요" | `chest_open` |
| 3 | 15초 | "턱을 목 쪽으로 천천히 당겨주세요 (10회 반복)" | `chin_tuck` |
| 4 | 10초 | "뒤통수를 손으로 밀며 뒷목 근육을 강화해주세요" | `neck_strengthen` |
| 5 | 10초 | "턱을 당기고 두 팔을 뒤로 쭉 펴서 기지개를 켜주세요" | `full_stretch` |
| 6 | 20초 | "목 마사지나 어깨 돌리기 등 자유롭게 스트레칭하세요" | `free_stretch` |

**총 소요 시간**: 105초 (1분 45초)

**완료 후**: 자동으로 타이머 모드로 전환 (30분 재시작)

---

## 🖼️ AI 이미지 생성 프롬프트 (나노바나나용)

### 공통 스타일 가이드
```
"Clean, minimalist illustration, health app style, warm ivory background, 
soft pastel colors, friendly and calming atmosphere, simple character design, 
focus on posture and movement"
```

### 화장실/산책 모드 이미지

**break_walk** (화장실/산책)
```
Person taking a gentle walk in a peaceful setting, or standing in a calm restroom area,
relaxed posture, stretching while walking, minimalist health illustration,
warm ivory and soft blue tones, calming atmosphere, simple background,
refreshing break moment, friendly character design
```

### 스트레칭 모드 각 단계별 프롬프트

1. **prepare** (준비)
```
A person sitting at desk with gentle smile, preparing to stand up, 
minimalist illustration, warm ivory tones, health app style, 
soft lighting, calming atmosphere
```

2. **warmup** (워밍업)
```
Person standing and doing gentle neck and shoulder warm-up stretches, 
rotating shoulders, soft movements, minimalist health illustration, 
warm beige background, friendly character design
```

3. **chest_open** (가슴 펴기)
```
Person standing with shoulders pulled back, chest open, chin slightly up, 
good posture demonstration, side view, minimalist health app illustration, 
ivory background, clean lines, encouraging pose
```

4. **chin_tuck** (턱 당기기)
```
Person doing chin tuck exercise, pulling chin towards neck, 
correct posture guide, front view, minimalist illustration, 
warm color palette, health app style, clear demonstration
```

5. **neck_strengthen** (뒷목 강화)
```
Person pressing back of head with hands, neck strengthening exercise, 
resistance training posture, minimalist health illustration, 
soft ivory background, focused expression, clear instruction visual
```

6. **full_stretch** (전신 스트레칭)
```
Person doing full body stretch with arms extended back, 
chin tucked, full stretch pose, minimalist illustration, 
warm tones, health app aesthetic, refreshing moment
```

7. **free_stretch** (자유 스트레칭)
```
Person doing various comfortable stretches, neck massage and shoulder rolls, 
relaxed atmosphere, minimalist health illustration, 
warm ivory background, multiple gentle movements, peaceful expression
```

---

## 🛠️ 기술 스택 및 구현 방향

### 추천 라이브러리
- **GUI**: `PyQt5` 또는 `PySide6`
  - Qt Style Sheets (QSS)로 CSS처럼 스타일링 가능
  - 크로스 플랫폼 지원
  
- **타이머**: `QTimer` (Qt 내장)
- **이미지 로딩**: `QPixmap`
- **사운드** (선택사항): `QSound` 또는 `pygame`

### 프로젝트 구조 (예상)
```
protect-neck/
├── main.py                 # 애플리케이션 진입점
├── ui/
│   ├── main_window.py     # 메인 윈도우
│   ├── timer_widget.py    # 타이머 화면
│   ├── choice_widget.py   # 선택 화면
│   ├── break_widget.py    # 화장실/산책 화면
│   └── stretch_widget.py  # 스트레칭 가이드 화면
├── resources/
│   ├── images/            # 스트레칭 이미지들
│   │   ├── break_walk.png # 화장실/산책 이미지
│   │   ├── prepare.png
│   │   ├── warmup.png
│   │   └── ...
│   └── styles/
│       └── main.qss       # Qt 스타일시트
├── core/
│   ├── timer.py           # 타이머 로직
│   └── sequence.py        # 스트레칭 시퀀스 데이터
└── requirements.txt
```

---

## ✅ 핵심 기능 요약

1. ✅ 30분 타이머 (카운트다운) + 일시정지/재생 기능
2. ✅ 타이머 완료 시 선택 화면 (스킵/스트레칭/화장실&산책)
3. ✅ 화장실/산책 모드 (자유 시간 + 복귀 버튼)
4. ✅ 7단계 스트레칭 가이드 (이미지 + 타이머 + 자막)
5. ✅ 자동 순환 (스트레칭 완료 → 타이머 재시작)
6. ✅ 모던하고 건강한 느낌의 UI/UX

---

## 🚀 향후 확장 가능성

- [ ] 타이머 시간 커스터마이징 (설정 탭)
- [ ] 스트레칭 통계 (오늘 몇 회 완료했는지 - 통계 탭)
- [ ] 사운드 알림 (타이머 종료 시)
- [ ] 시스템 트레이 아이콘 (백그라운드 실행)
- [ ] 스트레칭 루틴 커스터마이징

---

## 📝 다음 단계

이 기획서를 바탕으로 `protect-neck-guide.md` 개발 가이드 문서를 작성할 예정입니다.

---

## 가상환경
1. 프로젝트 폴더로 이동
cd C:\your\project\protect-neck

2. Python 3.10으로 가상환경 생성
py -3.10 -m venv venv

3. 가상환경 활성화
venv\Scripts\activate

4. 의존성 설치
pip install -r requirements.txt

5. Python 버전 확인
python --version
Python 3.10.x 로 나와야 해요!