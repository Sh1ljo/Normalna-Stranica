# Normalna stranica: cijela priča

**Cilj priče:** svijet nije onakav kakvim se čini, a većina toga je maska koja ljude drži zaokupljenima. Ispričano na "fora" način, ništa pogrdno, ništa ekstremno.

**Dizajn:** full minimalistički. Bijela pozadina, crni tekst, jednostavni textfieldovi. Bez cardova, gradijenata i sličnog. (Iznimke po priči: crna stranica hakera, konzola, stranica tvrtke.)

Napredak se čuva u `localStorage` (`ns_stage`). Za testiranje na localhostu: `?stage=N`, `?reset`, `?fast`. Gumb "Resetiraj" gore desno.

## Pregled faza

| Faza | Što je | Odgovor |
|---|---|---|
| 1 | Normalna stranica, kod jedva vidljiv sivo ispod textfielda | `12345` |
| 2 | Kod bijel na bijelom, treba "označi sve" (radi na mobitelu i računalu) | `16180` |
| 3 | Par slova u rečenici obojano drugačije, čitana redom daju kod | `maska` |
| 4 | Lažni dokument tvrtke (`dokument.html` / `dokument.pdf`), čita se u pregledniku | ukupan iznos isplaćen "inspektorima": `25050` |
| 5 | Animacija "Pristup odobren", pa natrag na normalnu stranicu, konzola: "Pristup odbijen", spajanje s operaterom, read-only chat | (nema unosa) |
| 6 | Hakiranje, crna stranica hakera, preuzimanje dokumenta u konzoli | (nema unosa) |
| 7 | Haker šalje na `tvrtkakompanija.com`, treba ime i prezime vlasnika | `Zvonimir Magonić` (dijakritici i redoslijed nisu bitni) |
| 8 | Haker traži šifru iz 5 slika na stranici tvrtke | `16180` |
| 9 | Nastavak slijedi | |

U kodu su to `stage` vrijednosti 1 do 4 (zagonetke), 5 (cutscena), 6 (ime vlasnika), 7 (šifra iz slika), 8 (kraj do sada napisanog).

## Faze 1 do 4

**Prva stranica.** Naslov "Normalna stranica" i ispod: *Dobrodošli na normalnu stranicu. Hvala što ste posjetili. Želimo Vam ugodan ostatak dana.* Ispod toga "Unesite kod", a ispod textfielda sivkasto ispisan kod da ga korisnik lako vidi. Kod je 12345.

**Druga stranica.** Isti naslov. *Uspjeli ste! Pronašli ste kod. Hvala puno što ste posjetili ovu stranicu, i želimo Vam ugodan ostatak dana.* Textfield, a između teksta i textfielda je kod 16180 u bijeloj boji, korisnik mora napraviti "select all".

**Treća stranica.** Isti naslov. *Još ste tu? Nismo očekivali da ćete dogurati ovako daleko. Ali svejedno hvala što ste uspjeli. Sad Vas molimo da napustite stranicu. Ugodan ostatak dana.* Nekoliko slova je obojano drugačije i čitana redom daju kod: **m a s k a**.

**Četvrta stranica.** Isti naslov, bez teksta. Samo lažni dokument tvrtke **Tvrtka Kompanija d.o.o.** (zapisnik o izvanknjigovodstvenim isplatama, Projekt "Zavjesa"), izmišljen, s klasificiranim informacijama o nečem nezakonitom (podmićivanje inspektora, prikrivanje ispuštanja otpadnih voda, krivotvorenje mjerenja). Izgleda kao pravi dokument, jednostavan za čitanje, čita se u pregledniku. Korisnik pronalazi ukupan iznos isplata označenih kao inspektori (12.500 + 8.200 + 4.350 = 25.050 EUR) i upisuje ga.

## Faza 5: pristup odobren, pa odbijen

Animacija: *Pristup odobren. Dobrodošli u Tvrtka Kompanija d.o.o. Učitavanje sučelja…* Čim se učita, korisnik se vraća na normalnu stranicu i dolje se otvara command prompt s tekstom *Pristup odbijen. Razlog: Neautorizirani login. Spajanje s vanjskim operatorom…*

Zatim na stranicu dolazi read-only chat u kojem se tvrtka javlja: ovo nismo smjeli učiniti, bili smo izloženi strogo povjerljivim dokumentima, neka ih ne dijelimo, i neka pričekamo par minuta dok operater ne odradi potrebne radnje. (U prototipu čekanje traje nekoliko sekundi, `OPERATOR_WAIT_MS` u `app.js`.)

Važno: dokument iz 4. faze korisnik mora skinuti da mu ostane za kasnije. Zato se link za preuzimanje nudi u fazi 6, u konzoli.

## Faza 6: haker

Čim operater to kaže, kratka minimalna animacija hakiranja (treperenje, "šum" u chatu). Teleportira nas na potpuno drugu stranicu: crna, bijeli tekst. Piše haker koji želi razotkriti tvrtku koja vlada cijelom Hrvatskom i svim velikim kompanijama. Ton: mirno, bez ekstrema, "ne vjerujte svemu što vidite". U konzoli je link za preuzimanje dokumenta (`TK-INT-2025-0417.pdf`).

## Faza 7: stranica tvrtke i ime vlasnika

Haker kaže korisniku da ode na **tvrtkakompanija.com** i tamo pronađe ime i prezime vlasnika. Stranica izgleda potpuno legitimno (stock slike, izbornik, novosti, kontakt).

- **Za sada** (dok ne deployamo) korisnik klikne link u konzoli koji ga vodi na lokalnu kopiju: `tvrtkakompanija/index.html`. Konstanta `SITE_URL` u `app.js`, kad se stranica objavi mijenja se u pravi URL.
- **Kasnije** korisnik neće dobiti link nego će morati dosta kopati da uopće nađe tu stranicu (tvrtka je spomenuta u dokumentu iz 4. faze).
- Ime vlasnika nije na naslovnici. Nalazi se samo na podstranici **Impressum** (mali link u podnožju svake stranice, i u "Naš tim" na stranici O nama): *Predsjednik uprave i vlasnik društva: Zvonimir Magonić.*
- Korisnik ime upisuje u konzolu. Haker odgovara da je to to.

## Faza 8: šifra iz 5 slika

Nakon malo tipkanja haker kaže da treba i šifru koja se nalazi unutar stranice. Šifra je **16180**. Na 5 slika je po jedna znamenka (crveno ili na neki način uočljivo). Slike idu redoslijedom izbornika, pa je poredak pomoć korisniku, ali nisu sve na istom mjestu: svaka je na drugoj podstranici. Korisnik ih spaja redom i upisuje šifru u konzolu.

### Gdje koja slika ide

Sve slike idu u `tvrtkakompanija/slike/`. **Jednostavno prepiši datoteku istim imenom** i sve radi, ne treba mijenjati kod. Trenutne slike su nasumični placeholderi (picsum.photos). Zamijeni ih svojim verzijama sa skrivenom znamenkom.

| Datoteka | Znamenka | Stranica (redoslijed u izborniku) | Gdje na stranici | Preporučena veličina |
|---|---|---|---|---|
| `slika-1.jpg` | **1** | Početna (1.) | velika naslovna slika pri vrhu | 1600 x 700 |
| `slika-2.jpg` | **6** | O nama (2.) | slika uz "Našu povijest", desno od teksta | 900 x 600 |
| `slika-3.jpg` | **1** | Usluge (3.) | široka slika na samom dnu stranice ("Naši pogoni"), treba skrolati | 1200 x 600 |
| `slika-4.jpg` | **8** | Novosti (4.) | slika uz najstariju vijest na dnu popisa ("Obilježeno dvadeset godina poslovanja") | 900 x 600 |
| `slika-5.jpg` | **0** | Kontakt (5.) | slika lokacije uz adresu | 900 x 600 |

Čitano redom: 1 - 6 - 1 - 8 - 0 = **16180**.

Ostale slike su samo dekoracija (nemaju znamenke): `ured-1.jpg` (Početna), `ured-2.jpg` (Usluge), `tim-1.jpg` (O nama). Također ih možeš zamijeniti.

Savjeti: `slika-1` i `slika-3` su široke, pa znamenka može biti manja i sakrivena u kutu. Ako je znamenka premala, mobitel je smanji. Slika se prikazuje u punoj širini stupca, pa ju testiraj i na mobitelu.

## Faza 9 i dalje

Nastavak slijedi. Trenutno se na kraju prikazuje "[ nastavak slijedi ]" nakon što haker kaže da je šifra ispravna.

## Datoteke

- `index.html`, `app.js`, `style.css`: igra (sve faze osim stranice tvrtke)
- `dokument.html`, `dokument.pdf`: lažni dokument iz 4. faze
- `tvrtkakompanija/`: lažna stranica tvrtke (`index`, `o-nama`, `usluge`, `novosti`, `kontakt`, `impressum`, `site.css`, `slike/`)
- Odgovori su za sada u klijentu (`app.js`). Prije objave `checkAnswer` postaje poziv na server i sadržaj sljedeće faze šalje se tek nakon točnog odgovora.
