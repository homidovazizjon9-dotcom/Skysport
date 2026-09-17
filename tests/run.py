#!/usr/bin/env python3
"""Прогон тестов приложения.

Каждый набор из tests/suites/ вставляется в копию настоящего index.html
и выполняется в headless Chrome. Firebase из копии выбрасывается — тесты
работают офлайн на реальных styles.css и app.js.

    python tests/run.py            # все наборы
    python tests/run.py 03         # только наборы, в имени которых есть "03"

Путь к Chrome можно задать переменной окружения CHROME.
"""
import glob
import html as html_mod
import io
import os
import re
import shutil
import subprocess
import sys

TESTS = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(TESTS)
BUILD = os.path.join(TESTS, '.build')
ASSETS = ('styles.css', 'app.js', 'sw.js')

# Ошибки страницы (битый скрипт, не загрузившийся файл) набор проверяет сам
ERROR_HOOK = (
    '<head>\n<script>window.__errs=[];'
    "addEventListener('error',e=>__errs.push((e.message||'resource error')"
    "+' @'+(e.lineno||'')+' '+(e.filename||e.target&&e.target.src||'')));</script>"
)

CHROME_CANDIDATES = [
    os.environ.get('CHROME'),
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
]


def find_chrome():
    for path in CHROME_CANDIDATES:
        if path and os.path.exists(path):
            return path
    found = shutil.which('chrome') or shutil.which('google-chrome') or shutil.which('chromium')
    if found:
        return found
    sys.exit('Chrome не найден. Укажи путь: CHROME="C:\\...\\chrome.exe" python tests/run.py')


def build(suite_path):
    """Собирает один html: настоящая разметка + тело набора."""
    name = os.path.splitext(os.path.basename(suite_path))[0]
    page = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    page = re.sub(r'<script type="module"[^>]*></script>', '', page, count=1)
    page = page.replace('<head>', ERROR_HOOK, 1)

    body = io.open(suite_path, encoding='utf-8').read()
    injected = '\n<script src="sw.js"></script>\n<script>\n(function () {\n' + body + '\n})();\n</script>\n</body>'
    cut = page.rindex('</body>')
    page = page[:cut] + injected + page[cut + len('</body>'):]

    out = os.path.join(BUILD, name + '.html')
    io.open(out, 'w', encoding='utf-8').write(page)
    return out


def run(chrome, page_path):
    # Свой профиль: чужой запущенный Chrome иначе держит блокировку и всё зависает
    url = 'file:///' + page_path.replace('\\', '/')
    proc = subprocess.run(
        [chrome, '--headless', '--disable-gpu', '--no-sandbox',
         '--user-data-dir=' + os.path.join(BUILD, 'chrome-profile'), '--dump-dom', url],
        capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=180)
    dom = proc.stdout or ''
    # Маркеры встречаются и в исходнике скрипта — результаты всегда последние
    blocks = re.findall(r'@@RESULTS@@(.*?)@@END@@', dom, re.DOTALL)
    if not blocks:
        return None
    return [line.strip() for line in html_mod.unescape(blocks[-1]).strip().split('\n') if line.strip()]


def main():
    wanted = sys.argv[1:]
    suites = sorted(glob.glob(os.path.join(TESTS, 'suites', '*.js')))
    if wanted:
        suites = [s for s in suites if any(w in os.path.basename(s) for w in wanted)]
    if not suites:
        sys.exit('Наборы не найдены')

    chrome = find_chrome()
    shutil.rmtree(BUILD, ignore_errors=True)
    os.makedirs(BUILD)
    for asset in ASSETS:
        shutil.copy(os.path.join(ROOT, asset), os.path.join(BUILD, asset))

    total = failed = 0
    for suite in suites:
        name = os.path.basename(suite)
        lines = run(chrome, build(suite))
        if lines is None:
            print('%-40s ОШИБКА: набор не выполнился (скорее всего синтаксис)' % name)
            failed += 1
            continue
        bad = [l for l in lines if l.startswith('FAIL') or l.startswith('EXCEPTION')]
        total += len([l for l in lines if l.startswith('PASS')]) + len(bad)
        failed += len(bad)
        print('%-40s %d проверок, %s' % (name, len(lines), 'всё зелёное' if not bad else '%d упало' % len(bad)))
        for line in bad:
            print('    ' + line)

    print('-' * 60)
    print('Итого: %d проверок, %d упало' % (total, failed))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
