## ADDED Requirements

### Requirement: Decorated skull is kept in the browser

The viewer SHALL save the things on the structure and the pen's strokes in the browser within a second of each change, and before the page closes. When the page opens again, the viewer SHALL put them back: each thing as the same model, on the same spot, with the same size, turn, color and other settings, and each stroke in its ink along its path. The status line SHALL say that the skull is back. Each asset set SHALL have a saved skull of its own.

#### Scenario: Page is opened again

- **WHEN** a person places things, resizes, turns and recolors them, draws strokes and reloads the page
- **THEN** the same things and strokes are on the skull, in the same places, sizes, turns and colors
- **AND** the status line says the skull is back

#### Scenario: Page is closed straight after a change

- **WHEN** a person places a thing and closes the page at once
- **THEN** the thing is on the skull when the page opens again

#### Scenario: Nothing is saved

- **WHEN** a person opens the viewer for the first time
- **THEN** the skull is bare and the status line says how to place a thing

### Requirement: Saved things whose models are gone

A saved thing SHALL be matched to a model by the painted thing it was cut from, so that a rebuilt asset set that numbers its models differently still brings back the same things. A saved thing that matches no model in the asset set SHALL be left out without an error, and the status line SHALL say how many things were left out. A saved setting beyond what the model's criteria allow now SHALL be brought within them.

#### Scenario: Models are numbered differently

- **WHEN** the asset set is rebuilt and the candy a saved thing was cut from now has another model id
- **THEN** the saved thing comes back as that candy

#### Scenario: Model is gone

- **WHEN** a saved thing was cut from a painted thing that the rebuilt asset set has no model for
- **THEN** the other things come back, that thing is left out, and the status line says one thing was left out

### Requirement: Storage may be refused

When the browser refuses to read or write its storage, as a private window can, the viewer SHALL work as it does with storage, and the status line SHALL say once that the skull will be gone when the page closes. A saved record that is damaged, or that was written in another format, SHALL be ignored, and an entry in a record that is not whole SHALL be left out.

#### Scenario: Storage is refused

- **WHEN** a person decorates the skull in a browser that refuses storage
- **THEN** things can be placed, changed, cleared and brought back as usual
- **AND** the status line says once that the skull will be gone when the page closes

#### Scenario: Saved record is damaged

- **WHEN** the saved record is not valid JSON
- **THEN** the viewer opens with a bare skull and raises no error

### Requirement: Starting over can be undone

"Clear" SHALL remove every thing and stroke, and SHALL keep the skull it removed as the last skull. "Arrange as painted" SHALL keep the skull it replaces as the last skull. While a last skull is kept, the menu SHALL show "Bring back the last skull", which SHALL put the last skull on the structure and keep the skull it replaces as the last skull. A bare skull SHALL NOT replace the last skull. The last skull SHALL be kept after the page closes.

#### Scenario: Skull is cleared by mistake

- **WHEN** a person presses "Clear", reloads the page and presses "Bring back the last skull"
- **THEN** the skull is as it was before "Clear"

#### Scenario: Two skulls are swapped

- **WHEN** a person clears a skull, places new things and presses "Bring back the last skull" twice
- **THEN** the first press brings back the cleared skull and the second brings back the new things

#### Scenario: Painted arrangement over a decorated skull

- **WHEN** a person presses "Arrange as painted" on a decorated skull and then "Bring back the last skull"
- **THEN** the decorated skull is back

### Requirement: Restored skull sets off nothing

When the page opens with a saved skull, the meadow SHALL stand at the growth for that number of things from the first frame. Restoring a skull SHALL NOT let out glitter, set off a burst or send a rabbit, and its pins SHALL NOT throb as new pins do. Things that were already along the spike SHALL NOT count as a new row. A restored skull of six or more things SHALL count as past the first rabbit, and a smaller one SHALL bring the first rabbit with the sixth thing on the structure.

#### Scenario: Eight things are restored

- **WHEN** a person opens the viewer with a saved skull of eight things, three of them along the horn
- **THEN** the meadow stands at a third of its full growth from the first frame
- **AND** no glitter, burst or rabbit appears

#### Scenario: Another thing along the horn

- **WHEN** the person then places a fourth thing along the horn
- **THEN** the burst of glitter comes and the status line reads "4 in a row on the horn"

#### Scenario: Three things are restored

- **WHEN** a person opens the viewer with a saved skull of three things and places three more
- **THEN** the rabbit comes with the sixth
