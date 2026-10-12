# K’NEX Studio

A browser-based Three.js editor for classic K’NEX parts, connected mechanisms, and interactive physics experiments. Independent software, not an official K’NEX product.

**[Open the live demo](https://ed-gpt.github.io/knex-studio/)** · [Report a bug or suggest an improvement](https://github.com/Ed-GPT/knex-studio/issues)

No installation required. Builds save in your browser; use **Save** to download a portable copy.

![Motor windmill in the editor, with connected-part selection and motor controls](docs/screenshots/windmill.png)

## Screenshots

### Build with real part references

![Twin-motor rover with the parts library, wheels, connectors, and green battery motors](docs/screenshots/rover.png)

### Explore the examples

![Visual example gallery with a windmill, gearbox, braced tower, rover, and double hinge](docs/screenshots/examples.png)

Screenshots captured from the working editor. Parts and physics are approximations; see the accuracy notes below.

## Run locally

Use a current Node.js release. No dependency installation or build step is needed.

```sh
npm run dev
```

Open http://127.0.0.1:5577. To use another port: `PORT=5578 npm run dev`.

```sh
npm run check
npm test
```

The complete static application is in `dist/`, including Three.js and cannon-es. See [hosting instructions](docs/HOSTING.md) for a website demo.

## Build and interact

- Drag parts from the library. Compatible endpoints and sockets snap together.
- Select a part or group. Pink stays selected; mint indicates hover.
- Drag movement arrows and rotation rings. Connected parts follow their mechanical joints.
- **Lock / Unlock** fixes a part's position and orientation. Press **G** or use the padlock. Layer editing locks are separate.
- **Detach** releases external joints while preserving the joints inside a selection. **Reconnect** snaps it elsewhere.
- **Clone** copies a selection. **Repeat +** uses the section's connection-grid spacing, reuses coincident parts, and skips obstructed additions.
- Open **Simulate** for stability, coupled joints, or motor playback. **Test drive** runs a vehicle copy in a separate playground.
- **Hints** toggles optional on-screen guidance. Fine adjustment, mass, transforms, connections, and part information are expandable.

| Shortcut | Action |
| --- | --- |
| V / B | Select / place |
| W / E | Move / rotate |
| G | Lock / unlock |
| F | Frame selection |
| Middle-drag / R | Rotate |
| C / Tab while placing | Connection method / socket |
| Alt-click | Select one part inside a group |
| Ctrl/Cmd D | Clone |
| Ctrl/Cmd Z | Undo |
| Escape | Cancel the current operation |

## Example gallery

Every thumbnail is rendered from the actual example model. Counts come from its parts, rather than handwritten claims. Opening an example first archives the current model; simulations start when requested.

| Level | Builds | Explore |
| --- | --- | --- |
| Simple | One square, Single hinge, Axle & bearings | Snapping, patterns, locking, sliding and rotation |
| Intermediate | Shared-edge grid, Playground swing, Wheeled chassis, Snap-on idler gears | Shared boundaries, gravity, wheels and axles |
| Advanced | Motor windmill, Two-stage gearbox, Braced tower, Twin-motor rover, Double hinge, Molded double hinge, Balance scale, Pantograph | Motor drives, gearing, layers, remote control, payloads and closed-loop joints |

The swing is a single-bay adaptation of a published guide. The wheeled chassis follows an illustrated vehicle guide with supported part variants. The other builds are original demonstrations of referenced K’NEX connection methods; they are not verified official building plans. The single hinge deliberately fixes its axle in space. Reference scenes for connector shapes, hubs/tyres and motor housings are separated from the build gallery. Each build has optional reference information.

Example definitions and factories live in `dist/examples.js`. Existing models remain compatible with the version-1 JSON format.

## Classic spring motor

**Motors → Spring motor** adds the original **92890** with a reconstructed transparent case, visible mechanism and four mounting eyes. The eyes form two paired passages for support rods; the central bore drives a separate axle.

Open **Examples → Spring motor fan**. Drag the rotor's rotation ring backward to wind it, or use **↶ +1 turn**. **Release spring** uses the stored turns and stops; **Hold** pauses. Winding survives save, undo and cloning. The 14-part fixture holds its supports fixed while the connected rotor turns.

![Spring motor winding preview](docs/screenshots/classic-spring-motor.png)

This is a finite-turn mechanical preview, with adjustable playback speed. Spring torque, real winding capacity and load-dependent speed remain unverified. The 20-turn software cap is not a physical specification. Spring vehicle motion is not yet supported in Test drive. See [sources, geometry estimates and limits](docs/CLASSIC-PARTS.md#classic-spring-motor-92890).

## Classic rod colors

The **Rods** flyout now filters by length and includes 34 additional Classic straight-rod colors plus the translucent rigid 90956W. **Generate → Grid & frame → Color** changes the cell rods without changing their stock size. Where available, braces use the same named color in the next stock length; otherwise they use the standard next-size rod.

Try **Examples → Rod color lattice**, or the **Classic rod colors** reference bench. Every variant has a separate part number and supplier approximate mass. Short rods retain their no-side-grip restriction. [Sources and reconstruction limits](docs/CLASSIC-PARTS.md#classic-rod-color-variants) include the two deferred mismatched supplier photos and the still-pending permanent curved rods.

![Classic rod colors filtered by stock length](docs/screenshots/classic-rod-colors.png)

## Classic connector colors

**Connectors** now includes 51 additional original-size color variants. Use the illustrated shape buttons to narrow the flyout, or search a part number. Matching eight-way colors retain motor mounts and tyre fitting; 3D variants retain their interlocking channels. Each variant keeps its own saved identity and approximate supplier mass.

![Connector shape filter and original eight-way color variants](docs/screenshots/classic-connector-colors.png)

Try **Examples → Black connector windmill** or the **Classic connector colors** reference scene. [Sources and reconstruction limits](docs/CLASSIC-PARTS.md#classic-connector-color-variants) cover every added identity. Colors and finishes are approximate; no Micro or K-Force parts are included.

## Snap-on idler gears

The original gray 91324 and black 99119 gears snap onto a rod end and spin independently of that rod. A locked support can therefore hold an idler while a motor drives the gears on either side. Select **Examples → Snap-on idler gears**, then start the motor. Gold and dark-blue 14-tooth, gray 34-tooth crown and black 82-tooth crown variants are also available under **Gears & chain**.

![Original snap-on idler and keyed output in the motor test fixture](docs/screenshots/classic-idler-gears.png)

See [part references and limits](docs/CLASSIC-PARTS.md#classic-snap-on-and-color-variant-gears). Geometry is reconstructed from photos; gear playback uses ideal parallel-axis and right-angle crown ratios, without torque or contact simulation.

## Visual grid and frame builder

Open **Generate → Grid & frame**. Choose a panel, rectangular frame, octagonal ring or tower, then use **+ / −** to grow its width, height and depth. The live 3D preview supports orbit, zoom, Front and Top views. Pick a Classic rod by its colored thumbnail; the cell size follows the actual modeled rod length plus its connector seats.

![Procedural frame built from Classic connectors and stock rods](docs/screenshots/frame-builder.png)

- **2D grids** use white 8-way 90908 connectors, vertically or horizontally. **3D frames** use interlocking pairs of blue 90907 connectors with sockets along all three axes. Shared cell boundaries contain one set of parts.
- Optional diagonal braces use the next stock rod size, with no rod stretching. Frame braces occupy XY and XZ faces. Gray-rod cells have no longer stock diagonal in this catalog, so braces are disabled for that size.
- The preview reports new, reused and skipped parts. **Position & details** allows precise placement against an existing build. Matching parts keep their IDs, groups, locks and mass settings; obstructed pieces, incomplete rods and isolated new hubs are skipped. Reused parts are cyan; skipped parts are pink. Collision bounds are conservative approximations.
- Generation is one undo step and produces individually editable parts, one selection group and layers for rows or levels. It is not a persistent parametric object. Use another adjacent generation or the existing pattern controls to extend it after insertion.
- Counts range from 1 to 30 cells per direction, subject to the existing 2,500-part model limit. Tests cover every stock rod size, all shared boundary directions, socket alignment, duplicate reuse, obstacles, save/import and a connected 2,072-part frame. The preview batches repeated geometry for large structures.

These are procedural demonstrations of the existing referenced Classic connector and rod system, not official building plans. Connector geometry and fit tolerances remain approximate; generated frames do not add structural load or collision simulation.

### Octagonal cell grids and frames

Choose **Octagonal grid** for a flat lattice or **Cell frame** for a spatial array. **Columns +** and **Rows +** repeat cells; **Levels +** grows their height. **Segments per side +** enlarges each octagon using whole stock rods. Flat grids can stand vertically or lie horizontally.

![Octagonal cell frame with shared walls and stock diagonals](docs/screenshots/octagonal-cell-frame.png)

Touching cells share full edges, rods and connectors. Four adjacent octagons leave a square opening between them. Spatial cells use paired blue 3D connectors and brace only the four compatible wall planes; shared walls retain one diagonal, not two crossing rods. Each cell has a layer, with shared boundary parts assigned to the first cell. Matching existing parts are reused on insertion, blocked spans are skipped, and insertion remains one undo step.

**Examples → Octagonal cell frame** opens a 589-part, six-cell example. Tests cover connected 2,300-part flat grids and 2,275-part spatial frames, all supported Classic rod variants, socket alignment, save/import, shared-wall extension and obstacles. These are original procedural constructions using existing modeled Classic parts, not official manual models or verified physical load-bearing designs. Connector geometry and collision bounds remain approximate; connector bending and buckling are not simulated. Molded panels are not generated for these shapes.

### Roof trusses and gable roofs

Choose **Roof truss** for a flat triangle or **Gable roof** for repeated triangular frames. **Half-span +** increases both half the width and the rise by one stock cell; the slope stays at 45°. **Depth bays +** extends the roof. The rafters always use the next matching stock rod length; unsupported rod choices are disabled. **Interior braces** adds diagonals inside the trusses and horizontal cross-bay planes while keeping the outside rafters when disabled.

![Visual stock-length gable roof generator](docs/screenshots/truss-builder.png)

Each bay gets a scene layer. Repeating at the previous roof's depth reuses the shared boundary truss. The same placement rules skip obstacles and incomplete spans, preserve existing parts and make insertion one undo step. **Examples → Gable roof** opens a 344-part demonstration. Tests cover a connected 2,334-part roof. This is an original procedural lattice, not a certified structural design; connector flexibility and buckling are not simulated. Only the actual XY and XZ socket planes receive braces. No molded roof panels or arbitrary slopes are inferred.

### Paneled grids and frames

Enable **Molded panels** and choose a color thumbnail. The builder offers only square panels that fit the selected stock rods: white, blue, yellow, red and tan rigid. Choosing panels turns diagonal braces off because they share sockets; choosing braces removes panels. Unsupported sizes disable the panel option.

Grids fill every cell in either plane. Rectangular frames cover front, back, top and bottom, with separate panel layers. Their two side faces stay open because the paired blue connectors do not provide diagonal sockets in that plane. Every panel has four actual peg connections. **Examples → Paneled tunnel** opens a 171-part, 282-connection demonstration.

![Procedural panel frame with matching colors and visible insertion control](docs/screenshots/paneled-frame-builder.png)

Shared boundaries reuse panels as well as rods and connectors. A blocked corner omits the whole new panel, preserving existing parts and connections. Broad overlap checks include the full size of large plates. Tests cover every compatible panel, extensions along all three axes, competing occupied sockets, save/import and a connected 2,401-part sheet. Browser verification includes previewing and inserting that sheet, then undoing it. The same 2,500-part model limit applies. Structural loads, flex and buckling are not simulated by the generator.

### Octagonal rings and towers

**Ring** makes a flat octagon in either plane. **Octagonal tower** stacks complete rings, with **+ / −** for stock rod segments per side and vertical levels. White 8-way connectors form rings; paired blue 3D connectors form tower nodes. The shape uses real 45° sockets and whole stock rods. Its width follows those lengths rather than an arbitrary radius.

![Octagonal tower preview with stock rods and editable side segments](docs/screenshots/octagonal-builder.png)

Tower braces occupy four alternating walls, where the paired connectors have a matching diagonal socket. Other walls remain open. Adjacent generations reuse a complete shared boundary ring, and duplicate or obstructed pieces follow the same reuse/skip rules as rectangular frames. Tests cover every offered rod size, both ring planes, a connected 2,400-part tower, obstacles, shared rings and saved user properties. **Examples → Octagonal tower** opens a 336-part demonstration with separate level layers. It is an original procedural build, not an official model or a verified load-bearing design.

## Visual path builder

Open **Generate → Path builder**, or choose **Flexi & track** in the part library.

![Visual path builder using Classic coaster cross-ties and split tubing](docs/screenshots/path-builder.png)

Importable paths: [hill](docs/paths/hill.json), [S-bend](docs/paths/s.json), [corner](docs/paths/bend.json).

- Drag pink handles in 3D; Shift-drag changes height. Top and Front views, numeric coordinates, add/remove handles, and Hill/S-bend/Corner presets provide alternative controls. Hints can be hidden.
- **Track:** repeat real green cross-ties 91430 along a spline, set spacing and banking, and generate two purple split-tubing cuts. The tubing is identified from the Thunderbolt Strike set 51587 manual, which documents 6.096 m stock lengths and cutting. Each rail must fit one stock length; rail joins are not generated.
- **Flexi:** select a documented 32, 52, 86 or 190 mm rod and its original color using length buttons and swatches, with two gray 90901 end connectors. Click a flexi in the library to shape that exact part; drag it into the workspace to place it straight. Editing resizes the reference curve to preserve the rod length. End sockets follow the curve tangents.
- **Save path / Import path:** exchange a `knex-path` version 1 JSON file containing `kind` (`track` or `flexi`), 2–24 XYZ `points` in millimetres, `spacing` (30–190 mm), and `bank` (−60 to 60 degrees). Flexi paths also save `flexiType`; older files default to green 91108. These are editor input bounds, not manufacturer bending limits. No proprietary coaster file import yet.
- **Add to model** inserts an editable group in one undo step. The generated local curves and tubing bank survive model saves, duplication and patterns. Save the path separately to retain the authoring handles; committed parts do not yet reopen as a procedural path.

Through-hole placement follows the pointer anywhere along a rod and seeks nearby clear space when occupied. It respects part thickness at the ends. The attached part remains free to slide; the existing continuous obstruction checks still apply.

### Real parts and uncertainties

| Part | Verified reference | Still approximate |
| --- | --- | --- |
| Classic flexi variants | [Supplier picture catalog, Classic Flexi rods and Rods sections](https://www.knexusergroup.org.uk/en/kpartslist.pdf): 32 mm 91480B/91480; 52 mm 91490/914901; 86 mm 91282/91282D/91283; 190 mm 91108/91107/91107Y/91109/90966 | Lengths are supplier approximations. Profile, colors, bend/twist limits and unsourced masses remain estimated. |
| Green flexi 91108 | [Supplier photo, approx. 190 mm, approx. 3.7 g](https://shop.knexusergroup.org.uk/products/91108) | Cross-section, flange details, minimum bend radius, spring stiffness |
| Green cross-tie 91430 | [Supplier photo and approx. 3.68 g](https://shop.knexusergroup.org.uk/products/91430) | Body dimensions, socket tolerances and gauge (rendered at an unverified 44 mm) |
| Purple split tubing, set 51587 | [K’NEX Thunderbolt Strike manual](https://www.knexusergroup.org.uk/bk/51587.pdf), pages 5 and 34–39 | Tube section, bending/twist limits and mass. No individual part number is claimed. |

The library expansion is tracked in [Classic parts coverage](docs/CLASSIC-PARTS.md).

The [Classic coaster guide](https://www.knexusergroup.org.uk/en/knex-hint-R2.html) confirms tubing on cross-tie posts. Shapes are photo/manual reconstructions, not factory CAD. Red tubing 403420V was not used because its supplier title and description disagree on stock length.

**Track output is an unsupported layout preview.** It does not include structural frames, flexi backbones, splices, lift chains or a car. Tubing-to-post links keep the layout together for editing; they are not an elastic solver. Curvature is reported geometrically, with no claim of a verified buildable bend. The editor does not validate self-intersections, rail clearance or structural feasibility. For balance, curves are held rigid; tubing mass uses an explicit unverified estimate of 0.019 g/mm until measured data is available.

## Mechanism stress examples

**Balance scale** is a 106-part adaptation of the [79565 balance instructions](https://www.knexusergroup.org.uk/bk/79565Levers.pdf), pages 3–6. Its braced beam has a low center of mass and independent hanging wheel weights. Run Joints, pull a weight, and release. Equal loads restore toward level; adding **Extra payload** to either side in the Joints panel makes that side fall. Changing payload pauses the simulation; press Run hinge to test the new load. Individual part mass remains editable under Weight & payload. The taller stand, 75 mm beam modules and vertically oriented weights differ from the manual.

![Balance scale with suspended wheel weights](docs/screenshots/balance-scale.png)

**Pantograph · 2×** is a 52-part adaptation of [Maths activity 16](https://www.knexusergroup.org.uk/en/K60030maths.pdf), pages 10–11. It uses equal 150 mm connector-center spans, real red rods and stacked rod-axle bearings. The guide's dedicated hinge halves are replaced with explicit Classic connector/axle stacks; the two long members each contain two rods. The central short-link joint is the input point and the far tip is the output. In Top view, run Joints and drag the input: the output moves at twice its displacement from the locked pivot. The model currently has no pencil, drawing surface or trace export.

![Pantograph linkage in Top view](docs/screenshots/pantograph.png)

Parallel-axis mechanisms preserve their plane, and joint closure accounts for both translation and rotational inertia. Mixed-axis mechanisms retain the spatial solver. Regression tests check equal/unequal loads, natural release motion, fixed supports, stock-length connections, retained axle stacks, harsh unreachable pulls, cancellation, saved-pose resumption and 30/60/120 FPS consistency. The pantograph's tested working-range copy residual is below 0.01 mm; the release test allows 0.2 mm near full extension, where the geometry is ill-conditioned. These are numerical checks, not hardware accuracy claims. Part collisions, travel stops, real bearing friction and elastic deformation remain unsimulated.

## Visual parts library

The left rail shows compact families. Click a family to open its visual flyout, search by color/name/part number, then click a part or drag it into the workspace. Escape, the close button or a click outside dismisses the picker. The main search finds parts across every family without expanding the rail.

![Compact part families and the wheel flyout](docs/screenshots/parts-flyout.png)

## Classic rigid rods

The Rods flyout includes tan **90957** (128 mm), black **919561**, yellow-white **91956**, translucent **90956W** and blue **90956B** (190 mm). Each keeps its own part identity, supplier approximate mass and color. The yellow-white and translucent rods use a solid square shaft reconstruction; the others use reconstructed ribbed profiles. These are the original-size stronger rods documented in [Hint A7](https://www.knexusergroup.org.uk/en/knex-hint-A7.html).

**Generate → Grid & frame** now accepts these rods. Tan rigid cells use black rigid diagonals; 190 mm cells have no matching stock diagonal, so braces switch off. Generated edges, shared boundaries and connections retain stock dimensions. **Examples → Rigid-rod tower** demonstrates a four-storey structure with tan edges and black braces, ready for a stability test.

![Generated frame using tan rigid rods and black rigid diagonals](docs/screenshots/classic-rigid-rods.png)

End snapping and axle bearings work with all five. Side gripping is available on ribbed variants; the solid yellow-white and translucent shafts’ side fit remains unverified and is disabled. Nominal lengths are rounded supplier labels; endpoints use the existing Classic grid spacing. Shaft section sizes and fit tolerances remain photo estimates. Rod bending, stiffness differences, buckling and fracture are not simulated. See [part references and limitations](docs/CLASSIC-PARTS.md#classic-rigid-rods).

## Classic clips and molded hinges

The Clips & spacers flyout includes blue **90912**, black **90919** and green **90913** hinge halves, plus blue **91440** and bronze **914401** rod-end stops. Each part has its own saved identity and photo-based profile. Blue pin halves mate with black or green socket halves through **Hinge** mode; the editor chooses this mode when a matching free half is present. Rod sockets use End or Side-on connections. End stops use End only.

Select the outer arm to rotate it with the gold ring or **R**. The pivot cannot slide apart. For a chain of hinges, run **Simulate → Joints** and drag either arm. **Examples → Molded double hinge** is a two-joint stress model with its small mounting fixture locked in space; it is not a freestanding stand or an official building plan. **Part reference scenes → Clips & hinge halves** also shows the two end-stop colors.

![Classic molded double hinge with the selected outer arm and rotation ring](docs/screenshots/classic-hinges.png)

The [Classic hinge guide](https://www.knexusergroup.org.uk/en/knex-hint-A8.html) documents the mating halves. Dimensions, boss clearances and contact stops remain estimates; hinge-to-hinge contact and physical maximum travel are not simulated. Generic through-rod use of the hinge bore is disabled until verified. [Part sources and approximate masses](docs/CLASSIC-PARTS.md#classic-clips-and-hinge-halves) are recorded separately.

## Classic Y clips

Ten referenced Classic Y-clip colors are available in **Clips & spacers**. Their compact C-jaw grips the side of a ribbed rod; their short male peg accepts a standard connector socket. Choose **Side-on** for the grip and **End** for the peg. The jaw is not treated as a full rod-end socket, axle bore or drive key. Short green rods cannot receive a side grip.

Side-on placement now follows the pointer along the shaft and seeks nearby clear space if the preferred position is occupied. After placement it is a rigid clip connection; use **Detach** and **Reconnect** to reposition a section. A Y clip with its jaw occupied can reconnect its free peg while carrying the attached rod with it.

**Examples → Part reference scenes → Y clips · grip & peg** shows all ten variants assembled on rods. The reference scene demonstrates connections and colors; it is not a manual build.

![Side-mounted Y clips, with one free peg and one attached connector](docs/screenshots/classic-y-clips.png)

Identities, photos and approximate supplier masses are recorded in [Classic parts coverage](docs/CLASSIC-PARTS.md#classic-y-clips). The [supplier's connection guide](https://www.knexusergroup.org.uk/en/knex-hint-A10.html) documents side gripping and connector attachment. Jaw/peg dimensions, metallic appearance, clearances and grip strength remain approximate. There is no elastic clip or slipping-force simulation.

## Classic ball-and-socket joints

The Clips & spacers flyout contains standard **90940 / 90945** and large **99036B / 99036S** ball-and-socket clips. Matching halves snap through **Ball joint** mode, selected automatically when a free compatible partner exists. The two sizes cannot cross-connect. Each half also has a standard rod jaw; neither has a generic axle hole or drive key.

Drag a terminal arm directly to aim it around its ball center, or use the three colored rotation rings. Clipped parts follow as a rigid group. For linked arms, use **Simulate → Joints → Run joints**, pull either arm and release. **Examples → Ball-joint pendulum** uses both sizes in a nine-part chain with a three-part fixture locked in space. It is an original motion demo, not a freestanding build or official manual model.

![Classic ball-joint arm rotated directly around its socket, with three rotation rings](docs/screenshots/classic-ball-joints.png)

The [Classic connection guide](https://www.knexusergroup.org.uk/en/knex-hint-A9.html) identifies these joint families and their spatial movement. [Part identities and approximate masses](docs/CLASSIC-PARTS.md#classic-ball-and-socket-clips) come from supplier listings. Geometry is reconstructed from photos, with unverified ball radii, cup profiles and clearances. Simulation constrains the ball center, but does not yet model socket contact, angular stops, friction at the snap fit or separation force. Extreme orientations can therefore overlap the cup. Mixed ball-and-hinge chains, hard pulling, locked supports, cancellation, frame-rate consistency and save/reload have automated coverage.

## Classic wheels

The library includes 16 referenced hubs and tyres, including silver/black spoked hubs, 37 and 50 mm racing hubs, narrow hubs, racing tread and slick tyres. **Examples → Part reference scenes → Racing wheels & bearings** opens a comparison bench.

Racing hubs snap onto rod ends and spin freely without sliding. Narrow and spoked hubs use through-holes. Tyres accept their documented hub families; the wide 50 mm racing tyre can hold two narrow hubs. A tan drive clip couples a compatible hub to a motor-driven axle. [Part identities, source guides and remaining limits](docs/CLASSIC-PARTS.md#classic-wheel-expansion) are documented separately.

![Classic wheel families and their distinct axle connections](docs/screenshots/classic-wheels.png)

## Classic angled supports

The orange 91690 clip fits a connector's triangular recess and holds a rod at 45° to its plane. Choose it from **Clips & spacers** and aim at a free recess. The keyed fit works from either face, preserves the connected assembly, and supports pattern copies. **Examples → Splayed support** opens an original four-leg build. [Sources and dimensional limits](docs/CLASSIC-PARTS.md#classic-angled-clip).

![Original Classic angled-clip support](docs/screenshots/classic-angled-clips.png)

## Original two-speed motor

The larger gray **92401 Tony motor** has its own reconstructed four-AA housing and mounting geometry. Open **Examples → Two-speed windmill**, then choose **Slow** or **Fast** in Simulate → Motors. The switch is saved with the part and used by controller keys and playground driving. Supplier approximate speeds are 48 and 240 RPM; playback does not calculate torque or battery load. [Sources and dimensional limits](docs/CLASSIC-PARTS.md#original-two-speed-motor).

![Two-speed motor driving an original windmill example](docs/screenshots/classic-two-speed-motor.png)

## Classic molded panels

**Parts → Panels** opens a searchable flyout with 35 original 910xx variants: four triangular sizes and four square sizes. Each uses molded rod-end pegs that snap into ordinary connector sockets. Square panels close four corner joints automatically when placed in a matching frame. Triangle panels have three straight pegs. No axle hole is inferred from the face perforations.

**Examples → Panel wall** opens a 35-part shared-corner build. **Part reference scenes → Classic molded panels** compares all eight shapes. Panels move with their connected assembly and retain their pegs through disconnect/reconnect, repeat and save. Supplier approximate masses contribute to balance and joint simulation.

![Classic molded panels mounted in a shared-corner frame](docs/screenshots/classic-panels.png)

The photos determine the outline, perforation pattern and peg arrangement; plate thickness, rib/peg tolerances and some dimensions remain estimates. Curved and flexible panels are still separate pending work. [Part identities and fit limits](docs/CLASSIC-PARTS.md#classic-molded-panels).

## Physics and accuracy

Parts are procedural reconstructions from identified references, not production CAD. Nominal rod lengths differ from effective connector-center spacing. Small clip details, clearances, motor housing dimensions and tooth shapes remain approximate. The catalog does not include every historical part. Classic flexi rods in four stock lengths and split-tubing track are available as shape previews; Micro track is not included.

- **Joints:** coupled rigid groups with gravity, mass and approximate inertia. Mouse pulling uses a force-limited, damped spring; pivot correction keeps connected hinges closed under hard pulls. Parallel-axis networks also correct rotational drift and preserve their motion plane, including closed loops. Ball-and-socket joints constrain their center while allowing spatial rotation; mixed networks remain spatial. Locked supports remain fixed. If no support is locked, the largest connected group is held fixed and the UI reports it. No part-to-part contacts, flexible members or gear transmission in this mode.
- **Stability:** approximate rigid-build balance and tipping against a flat floor. Joint poses are held fixed during this test.
- **Motors and gears:** imposed rotational speed and parallel-axis/right-angle crown gear ratios. No torque, battery-load or swept rotational collision simulation.
- **Playground:** approximate flat-ground traction and differential steering, without suspension, jumps or full vehicle contact physics.
- **Placement and sliding:** occupied sockets and conservative overlap checks. Axle sliding checks obstructions continuously. Free translation checks its destination; rotation does not have a complete collision solver.

These are separate simulation modes, not one general physics simulation. Supplier approximate masses and speed references are recorded in `dist/part-specs.js`; total operating mass can be overridden to include batteries or payload. Unverified dimensions are not presented as exact manufacturing measurements.

## Saving

Autosave and the recovery archive are local to a browser and site origin. **Save** downloads editable JSON; **Open** imports it. Use a downloaded file to transfer a build between the local editor, the hosted demo and another device. Export tools also provide a parts list and an image.

## References

- [K’NEX patent US7666054B2](https://patents.google.com/patent/US7666054B2/en): connection geometry and rod proportions.
- [Classic connection methods](https://www.knexusergroup.org.uk/en/knex-hint-A2.html) and [3D connectors](https://www.knexusergroup.org.uk/en/knex-hint-A4.html).
- [Enclosed motor mounting](https://www.knexusergroup.org.uk/en/knex-hint-M4.html) and [drive clips](https://www.knexusergroup.org.uk/en/knex-hint-W6.html).
- [Swing guide](https://www.knexusergroup.org.uk/en/knex-project-swing.html) and [wheeled vehicle guide](https://www.knexusergroup.org.uk/en/knex-project-vehiclewheeled.html).
- [Basic Fun Builder Basics instructions](https://www.basicfun.com/wp-content/uploads/2023/02/17010-Imagine-Builder-Basics.pdf) and [motorized instructions](https://www.basicfun.com/wp-content/uploads/2023/02/85049-325PC-Motorized-Creations-Core-Instructions.pdf).
- Part-specific sources are linked from the editor and retained in the catalog and `part-specs.js`.

## Project structure

- `dist/engine.js`: parts, sockets, snapping, connection graph and file validation.
- `dist/geometry.js` and `*-geometry.js`: procedural Three.js geometry.
- `dist/app.js`: editor, selection, interactions and simulation controls.
- `dist/examples.js`, `dist/example-gallery.js`: example factories and rendered gallery.
- `dist/hinge-system.js`, `dist/stability.js`, `dist/motor.js`: simulation modes.
- `dist/path-builder.js`, `dist/path-builder-ui.js`, `dist/flexible-parts.js`: sourced flexible parts and visual path generation.
- `dist/axle-placement.js`: nearest clear through-hole placement along a shaft.
- `tests/`: Node test suite for geometry, connections, motion, collisions, examples and serialization.

Bundled third-party notices: [Three.js](dist/vendor/THREE-LICENSE), [cannon-es](dist/vendor/cannon-es.LICENSE), and the font OFL notices under `dist/fonts/`.

## Right-angle crown gearing

Choose a gear, then **90° gears** in the floating placement toolbar. Point at a crown gear and use **R** to move the contact around its rim. Either assembly order works. Mount both gears on independent rods; add a tan key for freely spinning gears.

**Examples → Three-axis crown gearbox** runs two 34:14 stages through two corners. Its output turns at (34/14)², approximately 5.90 times input speed. The motor and four bearing connectors are locked test supports, not a freestanding frame.

Based on [K’NEX User Group Hint G1](https://www.knexusergroup.org.uk/en/knex-hint-G1.html). Pitch distances and the 3 mm crown contact plane are reconstructed estimates. This is ideal kinematic transmission without torque, tooth contact, backlash, slipping or swept collision simulation. Joints mode does not solve gear transmission.

![Two crown stages transferring rotation through three spatial axles](docs/screenshots/crown-gearbox.png)

## Original 12 V motor and white gear

The **92815 12 V motor** and **90983 dedicated white gear** have separate part identities. The housing mounts on two rods through its underside sleeves. **Worm drive** snaps only the matching motor/gear pair; the white gear cannot mesh with ordinary gears. Support its axle independently and use a tan clip to key the gear.

Open **Examples → 12 V reduction bench**. Its dedicated gear drives an axle carrying a separate 14-tooth gear, which drives the 82-tooth output at 14/82 speed. The 19-part fixture has 21 connections and 11 locked support parts. It is an original test fixture, not an official manual reproduction.

The RPM control previews the **white-gear axle**, defaulting to 5 RPM as a software choice. The supplier lists approximately 66 RPM without clearly identifying the shaft; neither that value nor an invented worm ratio is applied to the output. Reverse previews supply polarity. This tethered motor is excluded from remote vehicle controllers.

The housing, mounting dimensions, 41 mm gear diameter, 56 visual teeth and seven visible worm turns are reconstruction estimates. Tooth count, worm starts/lead, internal speed ratio, torque, electrical dynamics and tooth contact are unverified. The worm is static display geometry; preview imposes motion on the keyed output, not a calibrated worm simulation. Sources and mass provenance are in [Classic parts coverage](docs/CLASSIC-PARTS.md#original-12-v-worm-drive).

![Original 12 V drive and independent reduction axle](docs/screenshots/classic-12v-motor.png)


### Small Classic wheels: grip or free bearing

**Parts → Wheels** includes [91140 open-center](https://shop.knexusergroup.org.uk/products/91140) and [918300 closed-center](https://shop.knexusergroup.org.uk/products/918300) 25 mm wheels. The open wheel grips the axle and turns with it; a tan key is optional. The closed wheel snaps onto a rod end and spins independently. Neither takes an extra tyre. These distinct connections follow [Hint W1](https://www.knexusergroup.org.uk/en/knex-hint-W1.html).

**Examples → Small wheels · grip and spin** compares them on one powered shaft. Its support fixture is locked in space. The playground also recognizes complete wheels as rolling surfaces. Diameter and supplier mass are approximate; the 6.3 mm width, 4.3 mm bearing depth and molded details are photo estimates. Grip is idealized, with no calibrated slip or traction model.

![Powered comparison of original small wheels](docs/screenshots/classic-small-wheels.png)


### Pulley belts

**Generate → Pulley belt** connects two existing small or medium Classic hub/pulleys with the [original brown 92001 band](https://shop.knexusergroup.org.uk/products/92001). The preview shows the loop, fitted length and ideal speed ratio. Select a band to refit it after moving the pulleys. Both insertion and refitting are undoable; models retain the band and its two contacts.

![Original Classic pulley reduction fixture](docs/screenshots/pulley-drive.png)

**Examples → Pulley reduction drive** demonstrates a 0.74× reduction with both shafts turning the same way. Belts and gears can form one transmission. Locked or displaced outputs stop the motor before any part turns. The mounting follows [Hint W7](https://www.knexusergroup.org.uk/en/knex-hint-W7.html); the example is an original fixture locked in space.

Belt fit and tension are unverified. Supplier approximate section is 3 × 3 mm; modeled groove pitch radii are reconstruction estimates. The stated 185 mm unstretched length has an unspecified measurement convention. Playback assumes no slip and does not calculate elasticity, torque, friction, joint forces or a safe stretch limit. Crossed belts and multi-pulley routing remain future work.


### Original pulley colors and tyre fittings

The Wheels flyout now includes [gray small 90978G](https://shop.knexusergroup.org.uk/products/90978g), [gray medium 90979G](https://shop.knexusergroup.org.uk/products/90979g) and [white small 909782](https://shop.knexusergroup.org.uk/products/909782), alongside the silver variants. Each keeps its part number, supplier approximate mass, documented tyre fits and visible color. They slide and spin on rods, accept tan drive clips and work with the pulley-band builder.

**Examples → Pulley colors & fits** compares a white-to-gray 0.74× belt drive with a separate freely rotating tyre. The medium pulley now has the photographed five-rib front face. Small moulding details, widths, groove profile and reverse-face key recesses remain estimates; see the [reference ledger](docs/CLASSIC-PARTS.md#classic-pulley-variants).

![Pulley colors and fits](docs/screenshots/pulley-variants.png)
