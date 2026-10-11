# Classic parts coverage

This is an expansion ledger, not a claim that the library is complete. Scope: original-size Classic rods, connectors, clips, wheels, motors and associated mechanical parts. Micro, Kid K’NEX, brick systems and damaged-product stock variants are excluded. A part appearing in a current supplier catalog does not establish its original release year.

Source: [K’NEX User Group picture catalog](https://www.knexusergroup.org.uk/en/kpartslist.pdf), Classic sections; individual supplier pages are attached to implemented definitions. Catalog part numbers identify actual products; they do not certify the editor's dimensions or physics. Shapes are reconstructions unless stated otherwise.

## Implemented families

| Family | Available | Known limits |
| --- | --- | --- |
| Standard rigid rods | Six original lengths and standard colors | Nominal lengths differ from the engine's effective socket spacing; color and rigid-material variants still pending |
| Standard connectors | 1, straight 2, angled 2, 3, 4, 5, 8 way; 4 and 7 way 3D | Mold details approximate; additional original colors pending |
| Flexi rods | 12 variants across four approximate lengths, listed below | Fixed-length shape editing, tangent-aligned end sockets; no elastic dynamics or verified bend limits |
| Coaster track | 91430 cross-tie, split purple tubing identified in 51587 manual | Unsupported layout preview; no coaster vehicle or rail splice mechanics |
| Clips and spacers | 90900 tan drive clip, 848900 snap cap, 90994 blue spacer, 91224 sleeve; 90901 hole-end clip as 1-way connector | Three molded hinge halves and two rod-end stops, detailed below; other clip families pending |
| Wheels | 16 hubs/tyres: pulley, spoked, racing and narrow families | Rod-end bearings, through bores, compatible tyre seats and keyed drive; profiles and tolerances approximate |
| Gears and chain | 91317, 90988, 90985, 90993, 91998 and 90987 | Parallel-axis mesh only; chain is not an articulated transmission |
| Enclosed battery motors | 92840 blue, 22722 green | Imposed preview speed; dimensions and torque remain unverified |

## Flexi variants

Each entry has separate saved identity and a source link. Library clicks open the chosen variant in the path editor; dragging adds its straight stock shape. Length buttons and color swatches switch only among documented products. Older path files without a part identity still load as green 91108.

| Approximate length | Original color | Supplier reference |
| --- | --- | --- |
| 32 mm | Light blue | [91480B](https://shop.knexusergroup.org.uk/products/91480B) |
| 32 mm | Purple | [91480](https://shop.knexusergroup.org.uk/products/91480) |
| 52 mm | Mid blue | [91490](https://shop.knexusergroup.org.uk/products/91490) |
| 52 mm | Lilac | [914901](https://shop.knexusergroup.org.uk/products/914901) |
| 86 mm | Fluorescent orange | [91282](https://shop.knexusergroup.org.uk/products/91282) |
| 86 mm | Orange | [91282D](https://shop.knexusergroup.org.uk/products/91282D) |
| 86 mm | Red | [91283](https://shop.knexusergroup.org.uk/products/91283) |
| 190 mm | Green | [91108](https://shop.knexusergroup.org.uk/products/91108) |
| 190 mm | Fluorescent yellow | [91107](https://shop.knexusergroup.org.uk/products/91107) |
| 190 mm | Yellow | [91107Y](https://shop.knexusergroup.org.uk/products/91107Y) |
| 190 mm | Lilac | [91109](https://shop.knexusergroup.org.uk/products/91109) |
| 190 mm | Purple | [90966](https://shop.knexusergroup.org.uk/products/90966) |

![Stock-length buttons and original-color swatches in the path builder](screenshots/classic-flexis.png)

Green 91108 uses its previously sourced approximate 3.7 g mass. Other flexis currently use an explicit unverified length-based estimate of 0.019 g/mm; this is not a supplier measurement. Material colors, rib sections and molding details remain photo approximations. Black-speckled 91101 and translucent 91110 still need their material rendering checked.

## Classic wheel expansion

Eleven additional parts have separate saved identities and supplier references:

| Family | Parts | Connection |
| --- | --- | --- |
| Spoked 37 mm hubs | [91978 silver](https://shop.knexusergroup.org.uk/products/91978), [919780 black](https://shop.knexusergroup.org.uk/products/919780) | Through-hole; small 91975 tyre. Silver has a pulley groove. |
| Racing 37 mm hubs | [91174 gray](https://shop.knexusergroup.org.uk/products/91174), [91170 black](https://shop.knexusergroup.org.uk/products/91170) | Free-spinning rod-end bearing; 91150 treaded or 91380 slick tyre. |
| Racing 50 mm hub | [91184](https://shop.knexusergroup.org.uk/products/91184) | Free-spinning rod-end bearing; 91160 tyre. |
| Narrow 50 mm hubs | [91254 gray](https://shop.knexusergroup.org.uk/products/91254), [91254B black](https://shop.knexusergroup.org.uk/products/91254B) | Through-hole; one hub in 91240, or two hubs in 91160. |
| Racing tyres | [91150 for 37 mm hubs](https://shop.knexusergroup.org.uk/products/91150), [91160 for 50 mm hubs](https://shop.knexusergroup.org.uk/products/91160) | Compatible hubs only; 91150 also fits a white 8-way connector. |
| Slick and narrow tyres | [91380 slick](https://shop.knexusergroup.org.uk/products/91380), [91240 narrow](https://shop.knexusergroup.org.uk/products/91240) | 37 mm racing hubs and 50 mm narrow hubs respectively. |

The [racing wheel guide](https://www.knexusergroup.org.uk/en/knex-hint-W4.html) distinguishes rod-end racing bearings from narrow through-hole hubs, and documents two narrow hubs in a wide tyre. The [spoked-wheel guide](https://www.knexusergroup.org.uk/en/knex-hint-W5.html) confirms small-tyre compatibility. The [drive-clip guide](https://www.knexusergroup.org.uk/en/knex-hint-W6.html) documents keyed drive.

Racing bearings spin without sliding or driving automatically with a motor. A tan clip can couple their key holes to an axle. Black flat-spoked hub key holes have not been verified, so keyed placement is unavailable for that variant. Multiple white connectors stacked inside one racing tyre are not yet supported.

Supplier approximate masses are recorded per part in `part-specs.js`. Hub diameters are supplier approximations; widths, clearances, spoke profiles, rubber tread and most tyre outside diameters remain photo estimates. These are not manufacturing dimensions. The plain black racing-hub reconstruction represents the pictured five-spoke variant; supplier stock can vary.

Open **Examples → Part reference scenes → Racing wheels & bearings** for the 22-part comparison bench. It is an original reference scene, not an official vehicle plan.

![Classic racing, narrow and spoked wheels on independent axles](screenshots/classic-wheels.png)

## Classic clips and hinge halves

| Part | Identity and source | Connection / supplier approximate mass |
| --- | --- | --- |
| Blue hinge half | [90912](https://shop.knexusergroup.org.uk/products/90912) | Male pivot plus standard rod socket; 0.8 g |
| Black hinge half | [90919](https://shop.knexusergroup.org.uk/products/90919) | Mating socket pivot plus rod socket; 0.62 g |
| Green hinge half | [90913](https://shop.knexusergroup.org.uk/products/90913) | Same mating family; 0.62 g |
| Blue rod-end stop | [91440](https://shop.knexusergroup.org.uk/products/91440) | Grips a Classic rod end; 0.61 g |
| Bronze rod-end stop | [914401](https://shop.knexusergroup.org.uk/products/914401) | Same end-stop family; mass estimated, not sourced |

Supplier product photos identify the distinct boss, socket ring, standard jaw and solid-backed end stop. The green product's title and image identify green; its description contains copied black-color wording. These are reconstructed profiles, not imported production CAD. The 6.3 mm mating-plane separation, boss/bore radii, body thicknesses and molding clearances are unverified photo estimates. No generic through-rod fit is assumed for the hinge holes. End stops have neither a center bore nor a drive key.

The [hinge guide](https://www.knexusergroup.org.uk/en/knex-hint-A8.html) distinguishes this two-piece hinge from axle-and-connector hinges. Opposite halves snap at coincident pivots, preserve all rigidly clipped neighbors and rotate without translation. Chained hinges participate in the existing coupled simulation. Contact stops, maximum permitted hinge angle, snap force and wear are not simulated. Automated stress tests check closure during unreachable pulls and release, locked supports, save/import and rotation in multiple orientations.

The **Molded double hinge** example has a mounting fixture locked in space. It demonstrates the two joints rather than a complete supported real-world build. The **Clips & hinge halves** reference scene also includes a rod with both end-stop variants.

## Remaining coverage and reference work

The following are identified candidates, not yet implemented. Their names and numbers come from the Classic catalog; geometry and behavior must be verified before adding them. This list must be expanded as the remaining catalog is audited.

| Family | Identified candidates | Required work |
| --- | --- | --- |
| Clips | 91690 angled 3D; 90914 rod-end/Y clip; 90940/90945 ball and socket; 90911 splice; 3010001 straight without hole; 23692E end cap | Distinct geometry and actual connections; parts without bores must not inherit through-hole behavior |
| Hinges | 9091213 packaged assembly; 3020001 long half | Audit original-system scope and distinct long-half geometry; implemented standard halves already mate |
| Connector variants | Original color variants; distinct 90910 orange track connector | Reuse canonical geometry only when mold and connections match; audit interlock, motor mount and tyre compatibility |
| Rigid/curved rods | 90957 tan rigid 128; 91956/919561/90956B rigid 190; 91995 long 405; 3011001/3012001/3013001 curved; 3007001 X-rod | Verify physical profiles, endpoint spacing, side clips and material differences |
| Gears | 91700 partial crown, 90996 multitrack, 91324/99119 snap-on, 90983 motor gear; original color variants | Tooth count, profile, grip, perpendicular/worm transmission; avoid treating every gear as a parallel spur gear |
| Motors | 92890 spring, 92815 12 V, 92401 two-speed, 92875/20554/92880 tethered, 92845 control; 92660 solar | Separate housings, mounts, drive geometry and controls. The 12 V motor drives 90983 by a worm, not a coaxial rod bore |
| Wheel families | 20301 narrow wheel and remaining original variants | Verify distinct molded profile, axle grip and dimensions |
| Panels | 91010–91093 triangular/square panel families, 99020 curved, 99005/99007/99008 flexible | Attachment geometry, real sizes and optional mass; no generic plate substitutions |
| Other mechanisms | Pulleys, rubber bands, original coaster cars, lift components and special axles | Finish catalog audit and identify documented original parts and supported mechanics |

Additional motor references: [spring motor](https://www.knexusergroup.org.uk/en/knex-hint-M1.html), [12 V motor](https://www.knexusergroup.org.uk/en/knex-hint-M3.html), [two-speed motor](https://www.knexusergroup.org.uk/en/knex-hint-M9.html).
