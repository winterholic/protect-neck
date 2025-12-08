# -*- coding: utf-8 -*-
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

TOTAL_STRETCH_TIME = sum(step['duration'] for step in STRETCH_SEQUENCE)
