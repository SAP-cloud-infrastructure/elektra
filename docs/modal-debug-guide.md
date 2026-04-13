# Modal Debug Guide

## Problem
Modals öffnen sich nicht wenn man auf die Buttons klickt.

## Root Cause
Elektra verwendet ein **custom Modal-System** (`app/javascript/core/modal.js`) das Bootstrap's Standard-Modal überschreibt und AJAX-basiert ist.

## Lösung
Das Styleguide-Layout lädt jetzt jQuery und Bootstrap.js direkt von CDN, ohne das custom modal.js.

## Debug Steps

### 1. Server neu starten
```bash
# WICHTIG: Server muss neu gestartet werden!
rails server
```

### 2. Browser Console öffnen
1. Öffne: http://localhost:3000/styleguide/modals
2. Drücke **F12** (Chrome/Firefox) oder **Cmd+Option+I** (Mac)
3. Gehe zum **Console** Tab

### 3. Was du sehen solltest

In der Console sollte erscheinen:
```
Styleguide: jQuery version: 1.12.4
Styleguide: Bootstrap loaded: true
✅ Styleguide: Bootstrap modal is available
=== Styleguide Modals Debug ===
jQuery version: 1.12.4
Bootstrap modal available: true
```

### 4. Button klicken und Console beobachten

Klicke auf "Open Default Modal" und prüfe die Console:
```
Modal button clicked: #modal-default
Target exists: true
✅ Modal show event: modal-default
✅ Modal shown (visible): modal-default
```

### 5. Manueller Test

Klicke auf den blauen Button "Test Modal (JavaScript)" ganz oben auf der Seite.

**ODER** in der Browser Console eingeben:
```javascript
jQuery('#modal-default').modal('show')
```

Das Modal sollte sich öffnen.

## Mögliche Probleme

### Problem 1: jQuery nicht geladen
**Console zeigt:**
```
Styleguide: jQuery version: not loaded
```

**Lösung:** CDN blockiert oder Netzwerk-Problem
- Prüfe ob https://code.jquery.com/jquery-1.12.4.min.js erreichbar ist
- Öffne die URL direkt im Browser

### Problem 2: Bootstrap nicht geladen
**Console zeigt:**
```
Styleguide: Bootstrap loaded: false
```

**Lösung:** Bootstrap.js nicht geladen
- Prüfe ob https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js erreichbar ist

### Problem 3: Buttons klicken macht nichts
**Console zeigt keine "Modal button clicked" Meldung**

**Lösung:** JavaScript lädt zu spät
- Seite neu laden (Cmd+R / Ctrl+R)
- Hard Refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Cache leeren

### Problem 4: "Target exists: false"
**Console zeigt:**
```
Modal button clicked: #modal-default
Target exists: false
```

**Lösung:** Modal HTML nicht im DOM
- View-Datei nicht korrekt gerendert
- HAML Syntax-Fehler

### Problem 5: Modal Event triggered aber nichts passiert
**Console zeigt:**
```
✅ Modal show event: modal-default
```
**Aber Modal ist nicht sichtbar**

**Lösung:** CSS Problem
- Bootstrap CSS nicht geladen
- Modal Backdrop fehlt
- Z-index Problem

Prüfe im Browser Inspector (F12 → Elements):
```html
<div id="modal-default" class="modal fade in" style="display: block;">
```

Das Modal sollte `class="modal fade in"` und `style="display: block;"` haben wenn es offen ist.

## Alternative Test-Seite

Öffne diese Seite für einen simplen Test:
```
http://localhost:3000/modal-test.html
```

Diese Seite hat **keine** Elektra-Dependencies und sollte definitiv funktionieren.

## Was in der Console senden

Bitte kopiere und sende mir:

1. **Alle Console Messages** wenn du die Seite lädst
2. **Alle Console Messages** wenn du auf einen Modal-Button klickst
3. **Ergebnis von diesem Befehl** (in Browser Console):
```javascript
{
  jquery: typeof jQuery !== 'undefined' ? jQuery.fn.jquery : 'not loaded',
  bootstrap: typeof jQuery !== 'undefined' && typeof jQuery.fn.modal !== 'undefined',
  modalCount: jQuery('.modal').length,
  buttonCount: jQuery('[data-toggle="modal"]').length,
  firstModalId: jQuery('.modal').first().attr('id')
}
```

## Quick Fix Test

Falls alles andere fehlschlägt, teste ob jQuery überhaupt funktioniert:

```javascript
// In Browser Console:
jQuery('body').css('background', 'yellow')
```

Wenn der Hintergrund gelb wird → jQuery funktioniert.

Dann teste Bootstrap:
```javascript
// In Browser Console:
jQuery('#modal-default').modal('show')
```

Wenn das Modal sich öffnet → Bootstrap funktioniert, aber data-toggle hat ein Problem.

---

**Erstellt:** 2026-04-10  
**Zweck:** Debug guide für Modal-Probleme im Styleguide
