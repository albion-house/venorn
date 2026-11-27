## ADDED Requirements

### Requirement: Controls beside the skull on a wide, short screen

On a screen wider than it is tall and at most 500 pixels tall, the variations SHALL stand in a column at the left side and the categories at the lower right, inside the safe area, so that the front view shows the whole skull clear of them. The design bar SHALL open at the lower left, in place of the variations, clear of the skull in the front view. A taller screen SHALL keep the categories, the variations and the design bar where they are.

#### Scenario: Phone on its side

- **WHEN** a person opens the game on a phone on its side, in a browser that leaves the page 874 by 339 points
- **THEN** no part of the skull in the front view is behind the variations or the categories
- **AND** a tap on the jaw places a thing

#### Scenario: Many variations

- **WHEN** that person picks the flowers, which have 13 variations, and chooses the last one
- **THEN** the column of variations scrolls up and down and shows the chosen one

#### Scenario: Phone held upright and computer

- **WHEN** the game opens at 402 by 874 or at 1280 by 800
- **THEN** the categories, the variations and the design bar stand where they stood before this change

### Requirement: Wheel clear of the controls and the safe area

The wheel's buttons SHALL stand inside the screen's safe area and clear of the status line, the variations, the categories and the open design bar. On a wide, short screen, a small thing on the skull in the front view SHALL have its wheel around it, clear of its ring. Where no one side of the thing has room for all four buttons, they MAY stand two on each of two sides, in the same order clockwise.

#### Scenario: Thing on the skull, phone on its side

- **WHEN** a person on a phone on its side opens the wheel of a small thing anywhere on the skull in the front view
- **THEN** no button covers the thing or its ring
- **AND** every button is clear of the island, the controls and the status line, whichever way the phone is turned

#### Scenario: Design bar open

- **WHEN** that person opens the design bar from the wheel
- **THEN** the wheel's buttons stay clear of the thing and of the design bar
