## ADDED Requirements

### Requirement: About screen

The viewer SHALL open an About screen when it loads and when a person chooses "About", the first item in the menu. The screen SHALL show the work's title, its artist after "by", its image from the asset set and a link to the work's page that opens in a new tab. The browser tab SHALL name the work as its artist writes it.

#### Scenario: Game opens

- **WHEN** a person opens the game
- **THEN** the About screen shows "Veneration, Ornamentation", "by Fawnicorn" and the painting
- **AND** its link leads to https://fawnicorn.com/personal-art/veneration-ornamentation/ in a new tab
- **AND** the browser tab reads "venorn: Veneration, Ornamentation"

#### Scenario: About from the menu

- **WHEN** a person chooses "About" in the menu during play
- **THEN** the About screen opens

### Requirement: Closing the About screen

A button on the About screen SHALL close it and start the game or return to it, and its tap SHALL let the sound start. Escape SHALL close the screen too. While the screen is open, the keyboard's focus SHALL be on it, and taps and keys SHALL NOT reach the scene.

#### Scenario: Start

- **WHEN** the person presses the About screen's button
- **THEN** the screen closes and a tap on the skull places a thing
- **AND** the wind starts to sound

#### Scenario: Keyboard

- **WHEN** a person opens the About screen from the menu during play and presses a number key
- **THEN** the keyboard's focus is on the screen and the chosen category stays as it was
- **AND** pressing Escape closes the screen and leaves the skull as it was

### Requirement: About screen fits the screen

The About screen SHALL stay inside the safe area. It SHALL fit on a phone held upright and on a computer without scrolling, and SHALL scroll where it does not fit.

#### Scenario: Phone held upright and computer

- **WHEN** the game opens at 402 by 874 or at 1280 by 800
- **THEN** the title, the painting, the link and the button show without scrolling

#### Scenario: Phone on its side

- **WHEN** the game opens on a phone on its side, with the page 874 by 339 points and the Dynamic Island at one side
- **THEN** the painting and the words stand side by side, clear of the island
- **AND** the button can be reached, by scrolling if it does not fit

### Requirement: Version on the About screen

At its foot, in small type, the About screen SHALL give the commit the site was built from, linked to that commit on GitHub, the build date in UTC, and the asset set's release tag, linked to its release.

#### Scenario: Version

- **WHEN** a person opens the About screen on the published site
- **THEN** its last line gives the short commit id the site was built from, linked to that commit on GitHub
- **AND** the build date in UTC and the asset set's release tag, linked to the release
