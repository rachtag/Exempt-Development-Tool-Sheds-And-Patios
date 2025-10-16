# Below get_shed_help and get_patio_help and get_retain_wall_help provide HTML help information on the required attributes for each development type
get_shed_help = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>Shed Assessment Attributes</title>
        <style>
            body {
            font-family: Arial, sans-serif;
            padding: 20px;
            }
            h2 {
            color: #2c3e50;
            }
            table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            }
            th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            vertical-align: top;
            }
            th {
            background-color: #f4f4f4;
            }
            caption {
            caption-side: top;
            font-weight: bold;
            margin-bottom: 10px;
            }
        </style>
        </head>
        <body>
        <h2>Shed Assessment Attributes</h2>
        <p>For shed assessment, the JSON file must contain the following attributes:</p>
        <table>
            <thead>
            <tr>
                <th>Attribute Name</th>
                <th>Description</th>
                <th>Valid Options</th>
            </tr>
            </thead>
            <tbody>
            <tr><td>address</td><td>Address of development</td><td></td></tr>
            <tr><td>development</td><td>Type of development</td><td>shed</td></tr>
            <tr><td>zoning</td><td>Land zoning</td><td>R1, R2, R3, R4, R5, RU1, RU2, RU3, RU4, RU6</td></tr>
            <tr><td>heritage</td><td>Is the property a heritage item?</td><td>yes, no</td></tr>
            <tr><td>heritage_conserv</td><td>Is the property in a heritage conservation area?</td><td>yes, no</td></tr>
            <tr><td>rear_yard</td><td>Will the shed be built in rear yard?</td><td>yes, no</td></tr>
            <tr><td>foreshore</td><td>Is the property in a foreshore area?</td><td>yes, no</td></tr>
            <tr><td>sensitive_area</td><td>Is the property in an environmentally sensitive area?</td><td>yes, no</td></tr>
            <tr><td>area</td><td>Planned shed area (in m²)</td><td>numeric</td></tr>
            <tr><td>height</td><td>Planned shed height from ground level (in meters)</td><td>numeric</td></tr>
            <tr><td>boundary_distance</td><td>Distance from any site boundary (in mm)</td><td>numeric</td></tr>
            <tr><td>building_line</td><td>Is the shed behind the building line of road frontage?</td><td>yes, no</td></tr>
            <tr><td>shipping_container</td><td>Is the shed a shipping container?</td><td>yes, no</td></tr>
            <tr><td>stormwater</td><td>Will roofwater be disposed of without causing nuisance to adjoining owners?</td><td>yes, no</td></tr>
            <tr><td>metal</td><td>Will the shed use metal components?</td><td>yes, no</td></tr>
            <tr><td>reflective</td><td>Are metal components low-reflective or factory pre-coloured?</td><td>yes, no</td></tr>
            <tr><td>bushfire</td><td>Is the property on bushfire prone land?</td><td>yes, no</td></tr>
            <tr><td>distance_dwelling</td><td>Distance from dwelling (in meters)</td><td>numeric</td></tr>
            <tr><td>non_combustible</td><td>Will the shed be constructed of non-combustible materials?</td><td>yes, no</td></tr>
            <tr><td>adjacent_building</td><td>Will the shed be adjacent to an existing building?</td><td>yes, no</td></tr>
            <tr><td>interfere</td><td>Will it interfere with entry/exit or fire safety measures of adjacent building?</td><td>yes, no</td></tr>
            <tr><td>habitable</td><td>Is the shed planned to be habitable?</td><td>yes, no</td></tr>
            <tr><td>easement</td><td>Is the shed within 1m of a registered easement?</td><td>yes, no</td></tr>
            <tr><td>services</td><td>Will the shed have water or sewer connections?</td><td>yes, no</td></tr>
            <tr><td>existing_structures</td><td>Are there already two of the following on the lot: cabanas, cubby houses, ferneries, garden sheds, gazebos, greenhouses?</td><td>yes, no</td></tr>
            </tbody>
        </table>
        </body>
        </html>
        """

get_patio_help = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>Patio Assessment Attributes</title>
        <style>
            body {
            font-family: Arial, sans-serif;
            padding: 20px;
            }
            h2 {
            color: #2c3e50;
            }
            table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            }
            th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            vertical-align: top;
            }
            th {
            background-color: #f4f4f4;
            }
            caption {
            caption-side: top;
            font-weight: bold;
            margin-bottom: 10px;
            }
        </style>
        </head>
        <body>
        <h2>Patio Assessment Attributes</h2>
        <p>For patio assessment, the JSON file must contain the following attributes:</p>
        <table>
            <thead>
            <tr>
                <th>Attribute Name</th>
                <th>Description</th>
                <th>Valid Options</th>
            </tr>
            </thead>
            <tbody>
            <tr><td>address</td><td>Address of development</td><td></td></tr>
            <tr><td>development</td><td>Type of development</td><td>patio</td></tr>
            <tr><td>zoning</td><td>Land zoning</td><td>R1, R2, R3, R4, R5, RU1, RU2, RU3, RU4, RU6</td></tr>
            <tr><td>structure_type</td><td>New development or replacing existing structure?</td><td>new, replacement</td></tr>
            <tr><td>height_existing</td><td>Height of existing structure from ground level (in millimeters)</td><td>numeric</td></tr>
            <tr><td>material_quality</td><td>Will the structure use equivalent or better quality materials?</td><td>yes, no</td></tr>
            <tr><td>same_size</td><td>Will the structure be the same height and size as existing?</td><td>yes, no</td></tr>
            <tr><td>heritage</td><td>Is the property a heritage item?</td><td>yes, no</td></tr>
            <tr><td>foreshore</td><td>Is the property in a foreshore area?</td><td>yes, no</td></tr>
            <tr><td>area</td><td>Planned area of structure (in m²)</td><td>numeric</td></tr>
            <tr><td>land_size</td><td>Land size (in m²)</td><td>numeric</td></tr>
            <tr><td>total_structures_area</td><td>Total area of planned + existing structures (in m²)</td><td>numeric</td></tr>
            <tr><td>wall_height</td><td>Will any wall exceed 1.4m in height?</td><td>yes, no</td></tr>
            <tr><td>behind_building_line</td><td>Is the structure behind the building line of road frontage?</td><td>yes, no</td></tr>
            <tr><td>boundary_distance</td><td>Distance from site boundary (in mm)</td><td>numeric</td></tr>
            <tr><td>metal</td><td>Will the structure use metal components?</td><td>yes, no</td></tr>
            <tr><td>reflective</td><td>Are metal components non-reflective or factory coloured?</td><td>yes, no</td></tr>
            <tr><td>floor_height</td><td>Floor height from ground level (in mm)</td><td>numeric</td></tr>
            <tr><td>roof</td><td>Will the structure have a roof?</td><td>yes, no</td></tr>
            <tr><td>overhang</td><td>Roof overhang on any side (in mm)</td><td>numeric</td></tr>
            <tr><td>attached</td><td>Will the roof be attached to the dwelling?</td><td>yes, no</td></tr>
            <tr><td>above_gutter</td><td>Will the roof extend above the gutter line?</td><td>yes, no</td></tr>
            <tr><td>roof_height</td><td>Roof height above ground level (in meters)</td><td>numeric</td></tr>
            <tr><td>fascia_connection</td><td>Will the roof be connected to fascia?</td><td>yes, no</td></tr>
            <tr><td>engineer_spec</td><td>Will it be connected per engineers specs?</td><td>yes, no</td></tr>
            <tr><td>stormwater</td><td>Will roofwater be disposed into existing stormwater system?</td><td>yes, no</td></tr>
            <tr><td>drainage</td><td>Will the structure interfere with existing drainage or flow paths?</td><td>yes, no</td></tr>
            <tr><td>bushfire</td><td>Is the property on bushfire prone land?</td><td>yes, no</td></tr>
            <tr><td>distance_dwelling</td><td>Distance from dwelling (in meters)</td><td>numeric</td></tr>
            <tr><td>non_combustible</td><td>Will the patio be constructed of non-combustible materials?</td><td>yes, no</td></tr>
            </tbody>
        </table>
        </body>
        </html>
        """

get_retain_wall_help = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <title>Retaining Wall Assessment Attributes</title>
        <style>
            body {
            font-family: Arial, sans-serif;
            padding: 20px;
            }
            h2 {
            color: #2c3e50;
            }
            table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            }
            th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
            vertical-align: top;
            }
            th {
            background-color: #f4f4f4;
            }
            caption {
            caption-side: top;
            font-weight: bold;
            margin-bottom: 10px;
            }
        </style>
        </head>
        <body>
        <h2>Retaining Wall Assessment Attributes</h2>
        <p>For retaining wall assessment, the JSON file must contain the following attributes:</p>
        <table>
            <thead>
            <tr>
                <th>Attribute Name</th>
                <th>Description</th>
                <th>Valid Options</th>
            </tr>
            </thead>
            <tbody>
            <tr><td>address</td><td>Address of development</td><td></td></tr>
            <tr><td>development</td><td>Type of development</td><td>retain</td></tr>
            <tr><td>zoning</td><td>Land zoning</td><td>R1, R2, R3, R4, R5, RU1, RU2, RU3, RU4, RU6</td></tr>
            <tr><td>heritage</td><td>Is the property a heritage item? </td><td>yes, no</td></tr>
            <tr><td>heritage_conserv</td><td>Is the property in a heritage conservation area?</td><td>yes, no</td></tr>
            <tr><td>foreshore</td><td>Is the property in a foreshore area?</td><td>yes, no</td></tr>
            <tr><td>flood_control_lot</td><td>Is the property in a flood control area?</td><td>yes, no</td></tr>
            <tr><td>cut_or_fill</td><td>Depth of cut or fill required for retaining wall (in mm):</td><td>numeric</td></tr>
            <tr><td>boundary_distance</td><td>Distance from site boundary (in mm): </td><td>numeric</td></tr>
            <tr><td>rear_yard</td><td>Is retaining wall planned to be built in rear yard?</td><td>yes, no</td></tr>
            <tr><td>waterbody_within_40m</td><td>Is lot less than 40m from a natural water body?</td><td>yes, no</td></tr>
            <tr><td>sediment_transfer</td><td>Will planned retaining wall redirect the flow of any surface water or ground water or cause sediment to be transported onto an adjoining property?</td><td>yes, no</td></tr>
            <tr><td>height</td><td>Planned height of retaining wall (in mm):</td><td>numeric</td></tr>
            <tr><td>distance_other</td><td>Closest distance from planned retaining wall to any other structural support (in mm):</td><td>numeric</td></tr>
            <tr><td>distance_easement</td><td>Closest distance from planned retaining wall to an easement or services main (in mm): </td><td>numeric</td></tr>
            <tr><td>stormwater</td><td>Will planned retaining wall have adequate drainage lines connected into existing stormwater system? </td><td>yes, no</td></tr>
            <tr><td>fill_depth</td><td>Depth of fill for retaining wall (in mm):</td><td>numeric</td></tr>
            <tr><td>fill_area</td><td>Area of fill for retaining wall (in m²):</td><td>numeric</td></tr>
            <tr><td>fill_volume</td><td>Volume of fill for retaining wall (in m³):</td><td>numeric</td></tr>
            <tr><td>land_size</td><td>Land size (in m²)</td><td>numeric</td></tr>
            <tr><td>imported_fill</td><td>Will retaining wall be back filled with imported filler? </td><td>yes, no</td></tr>
            <tr><td>venm</td><td>Is imported fill VENM (Virgin Excavated Natural Material)?</td><td>yes, no</td></tr>
            </tbody>
        </table>
        </body>
        </html>
        """

# HTML template with dynamic table rendering for returning the contents of the assessment database
html_table_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Assessment DB Contents</title>
        <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <h2>Assessment DB Contents</h2>
        <table>
            <thead>
                <tr>
                    {% for col in columns %}
                        <th>{{ col }}</th>
                    {% endfor %}
                </tr>
            </thead>
            <tbody>
                {% for row in rows %}
                    <tr>
                        {% for cell in row %}
                            <td>{{ cell }}</td>
                        {% endfor %}
                    </tr>
                {% endfor %}
            </tbody>
        </table>
    </body>
    </html>
    """


