## ADDED Requirements

### Requirement: Steps for adding the game as an app

The menu's last item SHALL show how to add the game as an app in the browser the page is open in, in steps that follow the browser maker's help pages: Chrome on an iPhone or iPad, Safari on an iPhone or iPad, Chrome on Android, Chrome on a computer and Safari on a Mac. Where the browser offers its own install prompt, the steps SHALL have a button that opens it. In the game opened as an installed app, the item SHALL be hidden.

#### Scenario: Chrome on an iPhone

- **WHEN** a person opens the menu in Chrome on an iPhone
- **THEN** the last item reads "Add to Home Screen"
- **AND** choosing it shows the steps: Share at the right of the address bar, Add to Home Screen, then Add

#### Scenario: Safari on a Mac

- **WHEN** a person opens the menu in Safari on a Mac
- **THEN** the last item reads "Add to Dock"
- **AND** choosing it shows the steps: Share in the toolbar or the File menu, Add to Dock, then Add

#### Scenario: Chrome offers its prompt

- **WHEN** Chrome on a computer or on Android offers to install the game and a person chooses the item
- **THEN** the steps have an Install button that opens Chrome's prompt

#### Scenario: Installed app

- **WHEN** the game is opened from its icon on a home screen
- **THEN** the menu has no item for adding it as an app

### Requirement: Controls clear of the status bar

The menu button, the status line and the menu SHALL stand inside the screen's safe area at the top, and the wheel SHALL stay below the menu button. The menu SHALL scroll when it is taller than the room below the menu button.

#### Scenario: iPhone app

- **WHEN** the game runs as an app on an iPhone 17, with a safe-area inset of 62 points at the top
- **THEN** the menu button, the status line and the menu stand below 62 points
- **AND** the wheel of a thing near the top of the screen stands below the menu button

#### Scenario: Browser window

- **WHEN** the game runs in a browser window, where the safe-area inset at the top is 0
- **THEN** the menu button and the status line stand where they stood before this change

#### Scenario: Phone on its side

- **WHEN** a person opens the menu on a phone on its side
- **THEN** the menu ends above the bottom of the screen and scrolls to its last item
