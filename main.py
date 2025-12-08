# -*- coding: utf-8 -*-
import sys
from PyQt5.QtWidgets import QApplication
from ui.main_window import MainWindow
from utils import resource_path

def main():
    app = QApplication(sys.argv)

    # Load stylesheet
    try:
        qss_path = resource_path('resources/styles/main.qss')
        with open(qss_path, 'r', encoding='utf-8') as f:
            app.setStyleSheet(f.read())
    except Exception as e:
        print(f'Failed to load stylesheet: {e}')
        print(f'Tried to load from: {qss_path if "qss_path" in locals() else "unknown"}')

    window = MainWindow()
    window.show()

    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
