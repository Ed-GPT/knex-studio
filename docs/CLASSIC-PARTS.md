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
| Clips and spacers | 90900 tan drive clip, 848900 snap cap, 90994 blue spacer, 91224 sleeve; 90901 hole-end clip as 1-way connector | Additional original clip families pending |
| Wheels | 90978/90979 hubs, 91975/91976/91977 tyres | Bore, tyre fitting and keyed drive; remaining wheel families pending |
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

## Remaining coverage and reference work

The following are identified candidates, not yet implemented. Their names and numbers come from the Classic catalog; geometry and behavior must be verified before adding them. This list must be expanded as the remaining catalog is audited.

| Family | Identified candidates | Required work |
| --- | --- | --- |
| Clips | 91440 blue end stop; 91690 angled 3D; 90914 rod-end/Y clip; 90940/90945 ball and socket; 90911 splice; 3010001 straight without hole; 23692E end cap | Distinct geometry and actual connections; parts without bores must not inherit through-hole behavior |
| Hinges | 90919 black half, 90912 blue half, 90913 green half, 9091213 assembly, 3020001 long half | Verify hinge mating and pivot geometry; distinguish physical hinge pieces from existing axle hinges |
| Connector variants | Original color variants; distinct 90910 orange track connector | Reuse canonical geometry only when mold and connections match; audit interlock, motor mount and tyre compatibility |
| Rigid/curved rods | 90957 tan rigid 128; 91956/919561/90956B rigid 190; 91995 long 405; 3011001/3012001/3013001 curved; 3007001 X-rod | Verify physical profiles, endpoint spacing, side clips and material differences |
| Gears | 91700 partial crown, 90996 multitrack, 91324/99119 snap-on, 90983 motor gear; original color variants | Tooth count, profile, grip, perpendicular/worm transmission; avoid treating every gear as a parallel spur gear |
| Motors | 92890 spring, 92815 12 V, 92401 two-speed, 92875/20554/92880 tethered, 92845 control; 92660 solar | Separate housings, mounts, drive geometry and controls. The 12 V motor drives 90983 by a worm, not a coaxial rod bore |
| Wheel families | 91978 spoked, 91170/91174/91184 racing hubs, 91254 narrow, 91150/91160/91380 tyres, 91240 narrow tyre, 20301 narrow wheel | Original dimensions, tread, axle grip and hub/tyre fitting |
| Panels | 91010–91093 triangular/square panel families, 99020 curved, 99005/99007/99008 flexible | Attachment geometry, real sizes and optional mass; no generic plate substitutions |
| Other mechanisms | Pulleys, rubber bands, original coaster cars, lift components and special axles | Finish catalog audit and identify documented original parts and supported mechanics |

Additional motor references: [spring motor](https://www.knexusergroup.org.uk/en/knex-hint-M1.html), [12 V motor](https://www.knexusergroup.org.uk/en/knex-hint-M3.html), [two-speed motor](https://www.knexusergroup.org.uk/en/knex-hint-M9.html).
