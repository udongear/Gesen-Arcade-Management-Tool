import re, os, sys

UP = sys.argv[1]
OUT = sys.argv[2]

ACTIVE_FILES = [
    "index.html", "1-arcadeinfo.html", "1-financials.html", "1-staff.html",
    "1-vendors.html", "2-cabinets.html", "2-partssupplies.html", "2-playcards.html",
    "2-prizeinventory.html", "2-workorders.html", "0-profile.html", "0-help.html",
]
UNCHANGED_FILES = ["0-login.html", "style.css", "script.js"]

OLD_COMMUNITY_LI = '          <li><a href="3-community-placeholder.html" class="nav-link">Placeholder</a></li>\n'
NEW_COMMUNITY_LI = (
    '          <li><a href="3-wallet.html" class="nav-link">Wallet</a></li>\n'
    '          <li><a href="3-meetups.html" class="nav-link">Meetups</a></li>\n'
    '          <li><a href="3-leaderboards.html" class="nav-link">Leaderboards</a></li>\n'
    '          <li><a href="3-notifications.html" class="nav-link">Notifications</a></li>\n'
    '          <li><a href="3-suggestionboard.html" class="nav-link">Suggestion Board</a></li>\n'
)

def fix_settings_refs(content):
    content = content.replace('href="settings.html"', 'href="0-settings.html"')
    content = re.sub(r'href="settings\.html#', 'href="0-settings.html#', content)
    return content

def fix_community_nav(content):
    assert OLD_COMMUNITY_LI in content, "community li not found"
    return content.replace(OLD_COMMUNITY_LI, NEW_COMMUNITY_LI)

for fname in ACTIVE_FILES:
    with open(os.path.join(UP, fname), encoding="utf-8") as f:
        content = f.read()
    content = fix_settings_refs(content)
    content = fix_community_nav(content)
    with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
        f.write(content)
    print("wrote", fname)

for fname in UNCHANGED_FILES:
    with open(os.path.join(UP, fname), encoding="utf-8") as f:
        content = f.read()
    with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
        f.write(content)
    print("copied", fname)

with open(os.path.join(UP, "settings.html"), encoding="utf-8") as f:
    content = f.read()
content = fix_settings_refs(content)
content = fix_community_nav(content)

OLD_PANEL = '''      <div class="panel">
        <div class="panel-head"><h2>Community</h2></div>

        <div class="settings-row" id="community-placeholder">
          <div class="settings-row-main">
            <div class="settings-row-title">Placeholder</div>
            <div class="settings-row-desc">Planned as a standalone mobile app rather than a page on this site.</div>
          </div>
          <div class="settings-row-controls">
            <span class="badge-unavailable">Unavailable</span>
            <label class="switch disabled">
              <input type="checkbox" disabled>
              <span class="switch-track"><span class="switch-thumb"></span></span>
            </label>
          </div>
        </div>
      </div>'''

COMMUNITY_ROWS = [
    ("wallet", "Wallet", "Point cards and rewards &mdash; balances, tiers, and redemption history for every player."),
    ("meetups", "Meetups", "Lets players plan or announce meetups at the arcade."),
    ("leaderboards", "Leaderboards", "Live rankings for specific games and machines."),
    ("notifications", "Notifications", "Toggle email and mobile notifications for announcements, meetups, and more."),
    ("suggestion-board", "Suggestion Board", "Feedback board for the arcade, website, or mobile app."),
]

rows_html = []
for row_id, title, desc in COMMUNITY_ROWS:
    rows_html.append(f'''
        <div class="settings-row" id="{row_id}">
          <div class="settings-row-main">
            <div class="settings-row-title">{title}</div>
            <div class="settings-row-desc">{desc}</div>
          </div>
          <div class="settings-row-controls">
            <span class="badge-unavailable">Unavailable</span>
            <label class="switch disabled">
              <input type="checkbox" disabled>
              <span class="switch-track"><span class="switch-thumb"></span></span>
            </label>
          </div>
        </div>''')

NEW_PANEL = '      <div class="panel">\n        <div class="panel-head"><h2>Community</h2></div>\n' + "".join(rows_html) + '\n      </div>'

assert OLD_PANEL in content, "settings community panel not found"
content = content.replace(OLD_PANEL, NEW_PANEL)

with open(os.path.join(OUT, "0-settings.html"), "w", encoding="utf-8") as f:
    f.write(content)
print("wrote 0-settings.html")
