# Aircraft construction: manual study

Reviewed 16 October 2026 following Ed's rejection of the square-grid airplane.

## Reference 1: Energy, Motion & Aeronautics, set 79621

[Original K’NEX instruction booklet, hosted by K’NEX User Group](https://www.knexusergroup.org.uk/bk/79621.pdf). The [set page identifies the airplane](https://www.knexusergroup.org.uk/en/image_K79621model8.html). Visually inspected printed pages 20, 24, 25 and 28, including the assembly diagrams, not only extracted text.

- Pages 20–25 build a spatial fuselage with a wider front section, narrower rear section, crossmembers and wheel axles. Long gray rods visibly curve between the front and rear assemblies. This is not a stack of square cells. The diagram establishes their use, not their bend radius, load limit or exact deformed coordinates.
- Page 25 shows the gray rods installed as a curved fuselage outline and the main and tail wheel assemblies. Connectors, spacers and axle clips serve different mechanical roles; a connector at every grid corner is not an equivalent construction.
- Page 28 shows the next wing-support subassemblies and an assembled aircraft view: separate wing structures, triangular bracing and an upright tail. The assembly is sparse and uses longer members to bridge between sections.

This is the stronger visual reference for the requested larger aircraft. It is **not yet reproduced in the editor**. Remaining assembly pages must be traced before claiming a complete replica. The editor currently rejects `path` deformation on rigid gray rods, and its rod ports/axle logic assume a straight rod. Substituting a green flexi, shrinking a gray rod or drawing disconnected decorative curves would not reproduce this manual.

## Reference 2: Flying Fun Set

[Original K’NEX booklet hosted on the manufacturer's manual CDN](https://d2npjmct0hwe3x.cloudfront.net/wp-content/uploads/manuals/10-Model-Flying-Fun-Set-11556.pdf), printed pages 11–15. All five airplane pages were rendered and visually inspected. The download filename is not treated as proof of the printed set number.

- Page 11: wing modules combine straight runs, triangular tips, panels and three-dimensional connector junctions.
- Page 12: short rods in diagonal sockets support raised upper fuselage rails and lower assemblies. Connector orientation sets the geometry.
- Pages 13–14: orange flexible rods form the cockpit/tail curves; the tail includes separate horizontal and upright triangular structures.
- Page 15: a front subassembly and a propeller axle use an actual rod, spacers and clips.

Useful as a smaller assembly-validation reference. It does not meet the requested large-airplane scale on its own. Panel fits and flexi paths must be checked against the actual modeled sockets before claiming an accurate reconstruction.

## Corrected generation approach

1. **Reference and proportions.** Select an identifiable model and record the manual pages and steps. Rough volumes set overall length, span and clearance envelopes. They do not become occupied grid cells.
2. **Assembly graph.** Represent each real part, socket, joint, subassembly and symmetry relationship. Build one wing or fuselage section from the manual before repeating it. Use actual connector orientations, including diagonal sockets and perpendicular interlocks.
3. **Stock fit.** Choose rods from the catalog and solve endpoint positions and directions. Prefer fewer useful members and triangular bracing. A visually close edge is not a valid connection. Enlargement must select a compatible combination of stock parts, not scale the part meshes.
4. **Curves and mechanics.** Use flexis where the reference uses flexis. Ordinary rods shown bending require explicit, stock-length-preserving deformation support and tangent-correct ports. Until supported, identify that missing capability instead of silently substituting parts.
5. **Verify.** Check each manual step, inventory, socket occupancy, connected components, symmetry, collision clearance and mechanical degrees of freedom. Rendering and connectivity alone do not establish a physically buildable or load-bearing model.

## Current implementation boundary

The existing grid converter, files and aircraft test are preserved as an explicitly experimental tool. The dialog now starts with a box, and the MCP guidance no longer recommends this grid as the solution to a realistic aircraft request. No diagonal/manual aircraft replacement has been implemented or validated by this change. A future arbitrary-shape converter must pass the reference assembly checks above before it is presented as a faithful K’NEX builder.
