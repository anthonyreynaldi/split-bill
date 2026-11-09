# User Guide

*Bahasa Indonesia: [USER_GUIDE.id.md](USER_GUIDE.id.md)*

## What this app does
Split Bill helps a group work out who owes whom after shared meals or trips. Take a photo of a receipt, and the app reads the items for you. Then you choose who had what, and it calculates each person's share, including tax and service charge.

## Getting started
1. Open the app and choose **Register**. Enter your email and a password.
2. Log in.
3. Use the **ID / EN** button at the top to change the language at any time.

## Feature: Events
An **event** groups bills together, for example "Bali Trip" or "Friday Lunch".
1. Click **New event** and give it a name.
2. Add the **people** in the event. A name is enough, and they don't need an account.
   - Type a name and press **Enter**. The box clears, so you can type the next name right away.
   - To add many at once, paste a list such as `Ana, Budi, Citra` (or one name per line).
   - Fix a name by typing in its box. Remove someone with the bin icon, or bring them back with the undo icon.
   - When you're done, click **Save**. Nothing is saved before this, and **Discard** throws away the changes. If you remove people, you are asked to confirm. Their splits are removed, and bills they paid lose their payer.

## Feature: Add a bill from a photo
1. In an event, click **Add bill**. Then:
   - on a phone, tap **Take photo** to use the camera, or **Choose photo** to pick one from the gallery or files;
   - on a computer, click **Choose photo**.
2. Wait a few seconds while the app reads the receipt. The photo shows straight away. When reading succeeds, a small line says which AI model read it.
3. **Check the result against the photo.** Fix any item, quantity or price that looks wrong. If the receipt total differs from the calculated total, a warning shows the receipt's amount.
   - On a computer, the receipt stays next to the items while you scroll.
   - On a phone, tap **Show receipt** to pin it to the top of the screen, and scroll the items underneath. Tap **Hide receipt** to put it away.
   - Use the buttons above the photo to zoom in, fit it to the width, rotate a sideways photo, or open it full size.
4. Choose **who paid** this bill.
5. Click **Save**. Nothing is saved before this.

> The photo is sent to an AI reading service to extract the text. If reading fails, the photo stays attached and you can type the items yourself.

## Feature: Add or edit a bill by hand
Click **Add bill** and fill in the form below the upload box. Click **Add item** for each line (name, quantity, price). The line total is calculated for you, and you can overwrite it. The **Totals** panel updates as you type. Open a bill from the event page to edit or delete it.

## Feature: Who had what
For each item, choose:
- **Everyone**: everyone in the event shares it equally.
- **Choose people**: pick who had it and how many each, e.g. 3 satay portions → Ana 2, Budi 1. Halves are allowed.
- **Per unit**: each unit gets its own group of people. Example: 2 pizzas at Rp 30.000. Ana and Budi shared pizza 1, and Citra, Dedi and Eka shared pizza 2. Choose **Per unit**, then on **Unit 1** tick Ana and Budi, and on **Unit 2** tick Citra, Dedi and Eka. Ana and Budi pay Rp 15.000 each, and the other three pay Rp 10.000 each. **All** ticks everyone on that unit. Per unit works when the quantity is a whole number from 1 to 50.

**Tax, service and discount:** choose whether to share them **by what each person ordered** (fairer) or **equally**.

**Rounding:** if the receipt has a rounding line ("Pembulatan"), add a **Rounding** charge. It can be negative (e.g. −200) or positive. The photo reader fills it in for you when it finds the line. Rounding is applied after tax and shared the same way as the other charges.

## Feature: Summary and settlement
Open **Summary** to see, for each person, their items, their share of the charges, their total, and what they already paid.

There are two ways to settle up:
- **Per bill**: everyone pays back whoever paid each bill.
- **Nett**: amounts cancel out across bills, so fewer transfers are needed. Example: Ana paid lunch and Budi paid dinner. Instead of paying each other, only the difference is sent.

## Feature: Export and share
- **Excel**: downloads a spreadsheet of the summary.
- **Image**: makes a picture of the summary. Click **Image** and choose:
  - **Copy image**, then paste it straight into WhatsApp, Telegram or an email. Nothing is saved to your device.
  - **Share…** (on phones), which opens your phone's share menu so you can send it to a chat, email and so on.
  - **Download image**, which saves it as a PNG file.
- **Share link**: click **Share**, then **Create link**, and copy it. Anyone with the link can **view** (not edit) the summary.
  - Add a **passcode** (4–32 characters) and viewers must enter it once per device. After 5 wrong tries the link is locked for 15 minutes.
  - Untick **Link is active** to turn the link off at any time.

## FAQ
- **Why does someone's share show Rp 3.334 and the others Rp 3.333?** Money can't be split into fractions of a rupiah. The extra rupiah goes to one person, so the totals always match the receipt exactly.
- **Can friends edit the bill?** No. Share links are view-only.
- **I forgot the passcode.** The event creator can set a new one.

## Who to contact for help
Contact the app administrator (to be filled in).
