/**
 * Mecanic OS - Core Application Engine
 * Premium Workshop & Electronic Invoicing Management System
 */

// Embedded Database from Grupo Gema
const DEFAULT_DATABASE = {
  "clientes": [
    {
      "Codigo_Cliente": "CLIENT-CS-121225-203446",
      "Contribuyente?": "NO",
      "Tipo Cliente": "NATURAL",
      "Nombre": "DAVID ANTONIO MEJIA RAMIERZ",
      "Tipo Doc": "DUI",
      "Num Doc": "057852628",
      "Correo": "ventas@forbiddensoluciones.com",
      "Fecha Nacimiento": 36097,
      "Sexo": "MASCULINO",
      "Telefono 1 ": "78150614",
      "Direccion": "Res las Colinas, Senda Las Margaritas Cas a #13",
      "Depto": "05",
      "Municipio": "010215",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Credito?": "NO",
      "Renta:": "NO",
      "Usuario": "TEC-CS-181025-100910"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-210716-103-2",
      "Correo": "facturacion@cotranssv.com",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Depto": "05",
      "Municipio": "010213",
      "NRC": "252251-0",
      "Giro": "49233",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "COTRANS",
      "Renta:": "NO",
      "Monto Credito": 10000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-280120-102-5",
      "Correo": "cuentasporpagar@iflsv.com",
      "Telefono 1 ": "70190993",
      "Direccion": "AV. BERNAL Y CALLE LOS SISIMILES, COL. MIRAMONTE, #592",
      "Depto": "06",
      "Municipio": "010230",
      "NRC": "288637-2",
      "Giro": "49232",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "IFL",
      "Renta:": "NO",
      "Monto Credito": 2000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-181225-100609",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "BP GROUP SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Tipo Doc": "NIT",
      "Num Doc": "0526-091024-101-0",
      "Correo": "bpgroup.compras@gmail.com",
      "Telefono 1 ": "63016477",
      "Direccion": "BLVD BAZZINI PSJ. 1-40, CTON, HACIENDA NUEVA LOTIF. LAS ARBOLEDAS, DISTRITO DE COLON",
      "Depto": "05",
      "Municipio": "010217",
      "NRC": "350085-1",
      "Giro": "36000",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "BP GROUP",
      "Renta:": "NO",
      "Monto Credito": 1000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-200617-112-6",
      "Correo": "recepcion.compras@kaltmann.com",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Depto": "06",
      "Municipio": "010230",
      "NRC": "262561-1",
      "Giro": "52103",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "William Hernandez",
      "Renta:": "NO",
      "Monto Credito": 8000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-050126-142549",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "DROGUERIA NUEVA SAN CARLOS, S.A. DE C.V.",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-300880-003-0",
      "Correo": "conta.dnsc@grupocarosa.com",
      "Telefono 1 ": "22127200",
      "Direccion": "POLIG, G, LOTE 1, PLAN DE LA LAGUNA",
      "Depto": "05",
      "Municipio": "010217",
      "NRC": "28567-6",
      "Giro": "46484",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "GRANDE",
      "Credito?": "SI",
      "Atencion a: ": "Drogueria Nueva San Carlos",
      "Renta:": "NO",
      "Monto Credito": 6000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-070126-164307",
      "Contribuyente?": "SI",
      "Tipo Cliente": "NATURAL",
      "Nombre": "AGUILAR ESQUIVEL, OSCAR ORLANDO",
      "Tipo Doc": "NIT",
      "Num Doc": "02800331-5",
      "Correo": "ccfsdte@gmail.com",
      "Fecha Nacimiento": 31098,
      "Sexo": "MASCULINO",
      "Telefono 1 ": "77416665",
      "Direccion": "RESIDENCIAL VILLA NEJAPA POLIG, 1 CASA 21, NEJAPA",
      "Depto": "06",
      "Municipio": "010233",
      "NRC": "361415-0",
      "Giro": "96092",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "OSCAR ORLANDO",
      "Renta:": "NO",
      "Monto Credito": 100,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-151221-110-5",
      "Correo": "facturacion@grupopalaciosrecycling.com",
      "Telefono 1 ": "24070992",
      "Direccion": "KM 31 CALLE A SAN SALVADOR, CTON, FRENTA A IGLESIA PROFETICA, LOTE 4 Y 5,",
      "Depto": "05",
      "Municipio": "010217",
      "NRC": "310783-8",
      "Giro": "38304",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "Grupo Palacios",
      "Renta:": "NO",
      "Monto Credito": 1500,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-040226-083534",
      "Contribuyente?": "SI",
      "Tipo Cliente": "NATURAL",
      "Nombre": "Monica Liliana, Sanchez de Carcamo",
      "Tipo Doc": "NIT",
      "Num Doc": "0503-241077-103-6",
      "Correo": "carcamotransm24@gmail.com",
      "Sexo": "FEMENINO",
      "Telefono 1 ": "78609289",
      "Direccion": "calle principal polig A, col. loma linda cton, las moras #8",
      "Depto": "05",
      "Municipio": "010217",
      "NRC": "312001-0",
      "Giro": "49232",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "Pedro",
      "Renta:": "NO",
      "Monto Credito": 1000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-180226-094225",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "DIAGRI, S.A. DE C.V.",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-181001-103-8",
      "Correo": "proveedores@diagri.com.sv",
      "Telefono 1 ": "77291444",
      "Direccion": "CARR. DE SAN SALVADOR A SONSONATE KM 28 1/2",
      "Depto": "05",
      "Municipio": "010217",
      "NRC": "136975-9",
      "Giro": "46296",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "DIAGRI",
      "Renta:": "NO",
      "Monto Credito": 5000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-200226-172155",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "Soluciones logisticas, SA de CV",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-210114-104-8",
      "Correo": "administracion@solugistics.com",
      "Telefono 1 ": "22434348",
      "Direccion": "Blvd sergio viera de mello, local 3A, Colonia San Benito Edificio Century tower nivel 3,",
      "Depto": "06",
      "Municipio": "010230",
      "NRC": "230514-3",
      "Giro": "49233",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "William Hernandez",
      "Renta:": "NO",
      "Monto Credito": 4000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-020326-152908",
      "Contribuyente?": "SI",
      "Tipo Cliente": "NATURAL",
      "Nombre": "Lopez Alvarado, Xiomara Esmeralda",
      "Tipo Doc": "NIT",
      "Num Doc": "03850445-2",
      "Correo": "xiomara.lopez19871974@gmail.com",
      "Sexo": "FEMENINO",
      "Telefono 1 ": "79888712",
      "Direccion": "Carr a desvio de opico, cton primavera crio, milagro de la roca",
      "Depto": "05",
      "Municipio": "010216",
      "NRC": "325065-2",
      "Giro": "49233",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "Xiomara",
      "Renta:": "NO",
      "Monto Credito": 2500,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-120326-092544",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "ALS, S.A. DE C.V.",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-050601-103-3",
      "Correo": "facturadte.als@caexlogistics.com",
      "Telefono 1 ": "75300026",
      "Direccion": "Carr. a quezaltepeque, hacienda chanmico, #9156F1, ctguo a concretera salvadoreña",
      "Depto": "05",
      "Municipio": "010213",
      "NRC": "131646-5",
      "Giro": "49233",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "GRANDE",
      "Credito?": "SI",
      "Atencion a: ": "ALS",
      "Renta:": "NO",
      "Monto Credito": 5000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-230326-172808",
      "Contribuyente?": "SI",
      "Tipo Cliente": "JURIDICA",
      "Nombre": "REXIM, S.A. DE C.V.",
      "Tipo Doc": "NIT",
      "Num Doc": "0614-231291-101-0",
      "Correo": "e.factura@vape.com.sv",
      "Telefono 1 ": "22487400",
      "Direccion": "BLVD.  SUR. EDIF. EBEN-EZER, COL. SANTA ELENA",
      "Depto": "05",
      "Municipio": "010218",
      "NRC": "20073-5",
      "Giro": "49233",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "Rexim",
      "Renta:": "NO",
      "Monto Credito": 500,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-070426-181213",
      "Contribuyente?": "SI",
      "Tipo Cliente": "NATURAL",
      "Nombre": "ALARCON ARGUETA, JOSE ALFREDO",
      "Tipo Doc": "NIT",
      "Num Doc": "0306-260388-104-0",
      "Correo": "contabilidadtransportesalarcon@gmail.com",
      "Fecha Nacimiento": 32228,
      "Sexo": "MASCULINO",
      "Telefono 1 ": "77431696",
      "Direccion": "POLIG 7 , LOTIF. LA ESMERALDA, LOTE 17",
      "Depto": "03",
      "Municipio": "010242",
      "NRC": "294724-7",
      "Giro": "49233",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "Alfredo Alarcon",
      "Renta:": "NO",
      "Monto Credito": 1000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-130426-112812",
      "Contribuyente?": "SI",
      "Tipo Cliente": "NATURAL",
      "Nombre": "PINEDA RIVAS, CORLEO DAGOBERTO",
      "Tipo Doc": "NIT",
      "Num Doc": "00376680-9",
      "Correo": "corleopineda0@gmail.com",
      "Sexo": "MASCULINO",
      "Telefono 1 ": "79408090",
      "Direccion": "Polig C, lotif, 4, asentamiento comunal san diego, distrito de Metapan",
      "Depto": "02",
      "Municipio": "010239",
      "NRC": "362110-0",
      "Giro": "49232",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "Dagoberto",
      "Renta:": "NO",
      "Monto Credito": 1000,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-020526-093721",
      "Contribuyente?": "SI",
      "Tipo Cliente": "NATURAL",
      "Nombre": "Cruz Molina, Luis Roberto",
      "Tipo Doc": "NIT",
      "Num Doc": "1416-251082-101-0",
      "Correo": "sumavi_sv@yahoo.com",
      "Fecha Nacimiento": 30249,
      "Sexo": "MASCULINO",
      "Telefono 1 ": "78020965",
      "Direccion": "San Salvador",
      "Depto": "06",
      "Municipio": "010230",
      "NRC": "151843-4",
      "Giro": "47591",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Categoría Contribuyente": "OTROS",
      "Credito?": "SI",
      "Atencion a: ": "Luis Roberto",
      "Renta:": "NO",
      "Monto Credito": 2500,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "Codigo_Cliente": "CLIENT-CS-120526-083745",
      "Contribuyente?": "NO",
      "Tipo Cliente": "NATURAL",
      "Nombre": "Kevin Eduardo Martinez Chavez",
      "Tipo Doc": "DUI",
      "Num Doc": "06078895-1",
      "Correo": "kevinchavez17@outlook.com",
      "Fecha Nacimiento": 36687,
      "Sexo": "MASCULINO",
      "Telefono 1 ": "70134601",
      "Direccion": "Urb. villa lourdes psj 2, polig M casa #23",
      "Depto": "05",
      "Municipio": "010217",
      "Grupo": "IVA13",
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Credito?": "NO",
      "Atencion a: ": "Kevin",
      "Renta:": "NO",
      "Usuario": "TEC-CS-151225-083151"
    }
  ],
  "vehiculos": [
    {
      "ID_Vehiculo": "VEHICULO-CS-151225-070607",
      "Codigo_Cliente": "CLIENT-CS-121225-203446",
      "Nombre_Cliente": "DAVID ANTONIO MEJIA RAMIERZ",
      "Placas": "P 115598",
      "Marca": "19",
      "Modelo": "MODEL-CS-151225-070553",
      "Año": "2006",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Capacidad": "10 Toneladas",
      "Nª_Motor": "010203040506",
      "Nª_VIN": "010203040506",
      "Chasis Gravado": "010203040506",
      "Odometro": "525,000 Millas",
      "N° Equipo": "#15",
      "Usuario": "TEC-CS-181025-100910"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-301225-143712",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C124416",
      "Marca": "12",
      "Modelo": "MODEL-CS-301225-143755",
      "Año": "2022",
      "Clase": "ce2db1e4",
      "Color": "BLANCO",
      "Capacidad": "4T",
      "Nª_Motor": "OKH015",
      "Nª_VIN": "N/T",
      "Chasis Gravado": "JAANPR71HN7100750",
      "Odometro": "93734",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-301225-155729",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C130847",
      "Marca": "6",
      "Modelo": "MODEL-CS-301225-160128",
      "Año": "2024",
      "Clase": "ce2db1e4",
      "Color": "BLANCO",
      "Capacidad": "5",
      "Nª_Motor": "4D33R85861",
      "Nª_VIN": "N/T",
      "Chasis Gravado": "FE85CGA66238",
      "Odometro": "58206 km",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-301225-171407",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "P5180F",
      "Marca": "1",
      "Modelo": "MODEL-CS-301225-171539",
      "Año": "2024",
      "Clase": "abaded40",
      "Color": "BLANCO",
      "Capacidad": "0.8 TON",
      "Nª_Motor": "2NR4A82697",
      "Nª_VIN": "N/T",
      "Chasis Gravado": "MHKB3FE100K002518",
      "Odometro": "45160",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-301225-173214",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C130693",
      "Marca": "6",
      "Modelo": "MODEL-CS-301225-160128",
      "Año": "2024",
      "Clase": "ce2db1e4",
      "Color": "BLANCO",
      "Capacidad": "5",
      "Nª_Motor": "4D33R85727",
      "Nª_VIN": "N/T",
      "Chasis Gravado": "FE85CGA66232",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-301225-175138",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C124419",
      "Marca": "26",
      "Modelo": "MODEL-CS-301225-175246",
      "Año": "2022",
      "Clase": "ce2db1e4",
      "Color": "BLANCO",
      "Capacidad": "4",
      "Nª_Motor": "0KH255",
      "Nª_VIN": "N/T",
      "Chasis Gravado": "JAANPR71HN7100755",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-020126-132412",
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre_Cliente": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C117556",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-132638",
      "Año": "2005",
      "Clase": "ce2db1e4",
      "Color": "Verde",
      "Capacidad": "8T",
      "Nª_Motor": "n",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-020126-140936",
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre_Cliente": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C126126",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-132638",
      "Año": "2006",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Capacidad": "8T",
      "Nª_Motor": "2006",
      "Nª_VIN": "m",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-020126-145043",
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre_Cliente": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C124549",
      "Marca": "21",
      "Modelo": "MODEL-CS-020126-150722",
      "Año": "2009",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Capacidad": "8T",
      "Nª_Motor": "n",
      "Nª_VIN": "1HTMMMML0GH734959",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-020126-155332",
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre_Cliente": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C132216",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-155450",
      "Año": "2015",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Capacidad": "14",
      "Nª_Motor": "nn",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-030126-142844",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C138147",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-155450",
      "Año": "2019",
      "Clase": "ce2db1e4",
      "Color": "Rojo",
      "Capacidad": "12.3",
      "Nª_Motor": "472910S0565380",
      "Nª_VIN": "3AKJHHDR3KSHU6223",
      "Chasis Gravado": "3AKJHHDR3SHU6223",
      "Odometro": "1032467 km",
      "Imagen": "/appsheet/data/CarServices-958100207/VEHICULO-CS-030126-142844.Imagen.203413.jpg",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-050126-143552",
      "Codigo_Cliente": "CLIENT-CS-050126-142549",
      "Nombre_Cliente": "DROGUERIA NUEVA SAN CARLOS, S.A. DE C.V.",
      "Placas": "P969888",
      "Marca": "26",
      "Modelo": "MODEL-CS-050126-143618",
      "Año": "2021",
      "Clase": "bd06ab58",
      "Color": "Blanco",
      "Capacidad": "3 T",
      "Nª_Motor": "135M49",
      "Nª_VIN": "N/T",
      "Chasis Gravado": "JAA1KR55FM7100503",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-060126-091215",
      "Codigo_Cliente": "CLIENT-CS-050126-142549",
      "Nombre_Cliente": "DROGUERIA NUEVA SAN CARLOS, S.A. DE C.V.",
      "Placas": "P686858",
      "Marca": "7",
      "Modelo": "MODEL-CS-060126-091338",
      "Año": "2020",
      "Clase": "abaded40",
      "Nª_Motor": "LMH1CL31210451",
      "Chasis Gravado": "LZWCDAGA6LC804812",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-070126-165647",
      "Codigo_Cliente": "CLIENT-CS-070126-164307",
      "Nombre_Cliente": "AGUILAR ESQUIVEL, OSCAR ORLANDO",
      "Placas": "C128925",
      "Marca": "18",
      "Modelo": "MODEL-CS-070126-165703",
      "Año": "2009",
      "Clase": "ce2db1e4",
      "Color": "Verde",
      "Capacidad": "12.7",
      "Nª_Motor": "6067HG6E06R1009314",
      "Chasis Gravado": "1FUJA6CK19DAC0336",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-150126-081923",
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre_Cliente": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C136713",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-132638",
      "Año": "2019",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Nª_Motor": "nn",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-150126-085557",
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre_Cliente": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C134716",
      "Marca": "18",
      "Modelo": "MODEL-CS-150126-085612",
      "Año": "2020",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Nª_Motor": "n",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-220126-144930",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C131268",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-155450",
      "Año": "2013",
      "Clase": "ce2db1e4",
      "Color": "Negro",
      "Capacidad": "12.5 T",
      "Nª_Motor": "472903S0126729",
      "Nª_VIN": "1FUJGLDR8DSBV1958",
      "Chasis Gravado": "1FUJGLDR8DSBV1958",
      "Odometro": "2081145",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-220126-152516",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "P70E08",
      "Marca": "1",
      "Modelo": "MODEL-CS-051125-104557",
      "Año": "2024",
      "Clase": "bd06ab58",
      "Color": "Blanco",
      "Capacidad": "2 T",
      "Nª_Motor": "5L6365472",
      "Nª_VIN": "N/T",
      "Chasis Gravado": "JHHBFS6600K003187",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-220126-155627",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "P825A2",
      "Marca": "28",
      "Modelo": "MODEL-CS-220126-155657",
      "Año": "2025",
      "Clase": "bd06ab58",
      "Color": "Blanco",
      "Capacidad": "2 T",
      "Nª_Motor": "5L6369281",
      "Nª_VIN": "N/T",
      "Chasis Gravado": "JHHBFS6E3SK003856",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-220126-163536",
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre_Cliente": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C138771",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-155450",
      "Año": "2016",
      "Clase": "ce2db1e4",
      "Color": "Negro",
      "Capacidad": "12.55 T",
      "Nª_Motor": "472906S0373536",
      "Nª_VIN": "1FUJGLD54GLGY4000",
      "Chasis Gravado": "1FUJGLD54GLGY4000",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-220126-164305",
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre_Cliente": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C138798",
      "Marca": "18",
      "Modelo": "MODEL-CS-220126-164611",
      "Año": "2012",
      "Clase": "ce2db1e4",
      "Color": "Azul",
      "Capacidad": "12.45 T",
      "Nª_Motor": "8SB012206",
      "Nª_VIN": "1FUJGPBG8CDBM3998",
      "Chasis Gravado": "1FUJGPBG8CDBM3998",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-260126-184010",
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre_Cliente": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "RE4889",
      "Marca": "MARCA-CS-260126-185202",
      "Modelo": "MODEL-CS-260126-184124",
      "Año": "1998",
      "Clase": "N/D",
      "Capacidad": "16 T",
      "Nª_Motor": "N/T",
      "Chasis Gravado": "H206124",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-280126-165010",
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre_Cliente": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "RE 9358",
      "Marca": "MARCA-CS-280126-165536",
      "Modelo": "MODEL-CS-280126-165558",
      "Año": "1994",
      "Clase": "Remolque",
      "Color": "Furgon",
      "Nª_Motor": "N/T",
      "Chasis Gravado": "87365",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-280126-172544",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C126672",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-155450",
      "Año": "2013",
      "Clase": "ce2db1e4",
      "Color": "Azul",
      "Capacidad": "12.95 T",
      "Nª_Motor": "471903S0159094",
      "Nª_VIN": "3AKJGLDV1DSFA6797",
      "Chasis Gravado": "3AKJGLDV1DSFA6797",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-040226-090533",
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre_Cliente": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C131954",
      "Marca": "21",
      "Modelo": "MODEL-CS-020126-150722",
      "Año": "2014",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Nª_Motor": "ccc",
      "Chasis Gravado": "c",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-100226-090054",
      "Codigo_Cliente": "CLIENT-CS-040226-083534",
      "Nombre_Cliente": "Monica Liliana, Sanchez de Carcamo",
      "Placas": "C124611",
      "Marca": "18",
      "Modelo": "MODEL-CS-070126-165703",
      "Año": "2008",
      "Clase": "ce2db1e4",
      "Color": "Azul",
      "Nª_Motor": "c",
      "Chasis Gravado": "c",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-160226-091430",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "Poliza",
      "Marca": "MARCA-CS-160226-091441",
      "Modelo": "MODEL-CS-160226-091450",
      "Año": "2006",
      "Clase": "Remolque",
      "Color": "Anaranjado",
      "Nª_Motor": "N/T",
      "Chasis Gravado": "N/T",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-160226-104324",
      "Codigo_Cliente": "CLIENT-CS-040226-083534",
      "Nombre_Cliente": "Monica Liliana, Sanchez de Carcamo",
      "Placas": "C117696",
      "Marca": "18",
      "Modelo": "MODEL-CS-070126-165703",
      "Año": "2005",
      "Clase": "ce2db1e4",
      "Nª_Motor": "n",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-160226-112032",
      "Codigo_Cliente": "CLIENT-CS-040226-083534",
      "Nombre_Cliente": "Monica Liliana, Sanchez de Carcamo",
      "Placas": "C121689",
      "Marca": "18",
      "Modelo": "MODEL-CS-070126-165703",
      "Año": "2006",
      "Clase": "ce2db1e4",
      "Nª_Motor": "n",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-190226-171926",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C124427",
      "Marca": "26",
      "Modelo": "MODEL-CS-190226-171947",
      "Año": "2022",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Capacidad": "7.2",
      "Nª_Motor": "OKH219",
      "Chasis Gravado": "N/T",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-020326-153652",
      "Codigo_Cliente": "CLIENT-CS-020326-152908",
      "Nombre_Cliente": "Lopez Alvarado, Xiomara Esmeralda",
      "Placas": "C120604",
      "Marca": "18",
      "Modelo": "MODEL-CS-020326-153948",
      "Año": "2007",
      "Clase": "ce2db1e4",
      "Color": "Rojo",
      "Capacidad": "Tara 7.9",
      "Nª_Motor": "6067HV6E06R0949790",
      "Chasis Gravado": "N",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-020326-160346",
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre_Cliente": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C126710",
      "Marca": "18",
      "Modelo": "MODEL-CS-020326-153948",
      "Año": "2008",
      "Clase": "ce2db1e4",
      "Color": "Rojo",
      "Nª_Motor": "nn",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-020326-175426",
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre_Cliente": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C129928",
      "Marca": "21",
      "Modelo": "MODEL-CS-020126-150722",
      "Año": "2016",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Capacidad": "8.9 tara",
      "Nª_Motor": "73788208",
      "Chasis Gravado": "1HT",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-190326-091007",
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre_Cliente": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C140948",
      "Marca": "20",
      "Modelo": "MODEL-CS-190326-091102",
      "Año": "2012",
      "Clase": "ce2db1e4",
      "Color": "Celeste",
      "Nª_Motor": "NDRV",
      "Chasis Gravado": "1XP4",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-190326-105419",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "RE 18767",
      "Marca": "MARCA-CS-260126-184110",
      "Modelo": "MODEL-CS-260126-184124",
      "Año": "1996",
      "Clase": "Remolque",
      "Nª_Motor": "N/T",
      "Chasis Gravado": "NN",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-300326-150107",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "P831CC",
      "Marca": "6",
      "Modelo": "MODEL-CS-301225-160128",
      "Año": "2025",
      "Clase": "bd06ab58",
      "Color": "Blanco",
      "Nª_Motor": "4D33S01763",
      "Chasis Gravado": "FE71CBA66637",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-070426-181716",
      "Codigo_Cliente": "CLIENT-CS-070426-181213",
      "Nombre_Cliente": "ALARCON ARGUETA, JOSE ALFREDO",
      "Placas": "C134152",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-132638",
      "Año": "2011",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Capacidad": "8.1 T",
      "Nª_Motor": "NDRV103422024",
      "Chasis Gravado": "1FVACWDT1BDBD4713",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-090426-175447",
      "Codigo_Cliente": "CLIENT-CS-200226-172155",
      "Nombre_Cliente": "Soluciones logisticas, SA de CV",
      "Placas": "C119865",
      "Marca": "26",
      "Modelo": "MODEL-CS-090426-175651",
      "Año": "2013",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Nª_Motor": "4HK1037433",
      "Chasis Gravado": "JD7301363",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-130426-102100",
      "Codigo_Cliente": "CLIENT-CS-180226-094225",
      "Nombre_Cliente": "DIAGRI, S.A. DE C.V.",
      "Placas": "C123817",
      "Marca": "26",
      "Modelo": "MODEL-CS-130426-102129",
      "Año": "2021",
      "Clase": "ce2db1e4",
      "Nª_Motor": "n",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-140426-182725",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C132092",
      "Marca": "26",
      "Modelo": "MODEL-CS-190226-171947",
      "Año": "2024",
      "Clase": "ce2db1e4",
      "Nª_Motor": "0VN072",
      "Chasis Gravado": "JAANPR71KR7100364",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-220426-135040",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "RE 18768",
      "Marca": "MARCA-CS-220426-135601",
      "Modelo": "MODEL-CS-220426-135640",
      "Año": "1996",
      "Clase": "Remolque",
      "Nª_Motor": "N/A",
      "Chasis Gravado": "N/A",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-290426-133244",
      "Codigo_Cliente": "CLIENT-CS-180226-094225",
      "Nombre_Cliente": "DIAGRI, S.A. DE C.V.",
      "Placas": "C125306",
      "Marca": "21",
      "Modelo": "MODEL-CS-290426-133339",
      "Año": "2014",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Nª_Motor": "n",
      "Chasis Gravado": "3HAMMAAL5FL584679",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-020526-094612",
      "Codigo_Cliente": "CLIENT-CS-020526-093721",
      "Nombre_Cliente": "Cruz Molina, Luis Roberto",
      "Placas": "RJ2048",
      "Marca": "18",
      "Modelo": "MODEL-CS-020326-153948",
      "Año": "2004",
      "Clase": "ce2db1e4",
      "Nª_Motor": "n",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-050526-093418",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "C127040",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-155450",
      "Año": "2012",
      "Clase": "ce2db1e4",
      "Color": "Verde",
      "Nª_Motor": "n",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-050526-094343",
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre_Cliente": "COTRANS, S.A. DE C.V.",
      "Placas": "RE 19189",
      "Marca": "MARCA-CS-260126-184110",
      "Modelo": "MODEL-CS-260126-184124",
      "Año": "2004",
      "Clase": "Remolque",
      "Nª_Motor": "N",
      "Chasis Gravado": "N",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-180526-094352",
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre_Cliente": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Placas": "C88242",
      "Marca": "18",
      "Modelo": "MODEL-CS-180526-094411",
      "Año": "2000",
      "Clase": "ce2db1e4",
      "Color": "Rojo",
      "Nª_Motor": "n",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-190526-171223",
      "Codigo_Cliente": "CLIENT-CS-200226-172155",
      "Nombre_Cliente": "Soluciones logisticas, SA de CV",
      "Placas": "C125211",
      "Marca": "18",
      "Modelo": "MODEL-CS-020126-132638",
      "Año": "2006",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Nª_Motor": "SAP92390",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-200526-114905",
      "Codigo_Cliente": "CLIENT-CS-070426-181213",
      "Nombre_Cliente": "ALARCON ARGUETA, JOSE ALFREDO",
      "Placas": "C67250",
      "Marca": "18",
      "Modelo": "MODEL-CS-200526-114944",
      "Año": "2003",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Nª_Motor": "CKM55359",
      "Chasis Gravado": "N",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-200526-115341",
      "Codigo_Cliente": "CLIENT-CS-070426-181213",
      "Nombre_Cliente": "ALARCON ARGUETA, JOSE ALFREDO",
      "Placas": "C88562",
      "Marca": "18",
      "Modelo": "MODEL-CS-200526-115457",
      "Año": "2000",
      "Clase": "ce2db1e4",
      "Color": "Negro",
      "Nª_Motor": "906932001291137",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_Vehiculo": "VEHICULO-CS-280526-141952",
      "Codigo_Cliente": "CLIENT-CS-180226-094225",
      "Nombre_Cliente": "DIAGRI, S.A. DE C.V.",
      "Placas": "C84344",
      "Marca": "18",
      "Modelo": "MODEL-CS-280526-142157",
      "Año": "1997",
      "Clase": "ce2db1e4",
      "Color": "Blanco",
      "Nª_Motor": "n/d",
      "Chasis Gravado": "n",
      "Usuario": "TEC-CS-151225-083151"
    }
  ],
  "productos": [
    {
      "ID_ Producto": "PROD-CS-151225-143126",
      "Descripcion": "FRICCIONES",
      "Presentacion": 123456,
      "Division": "1001",
      "Categoría": "100104",
      "Precio Unit": 33,
      "Precio Unit Iva Inc": 37.29,
      "Fecha Creacion": 46006,
      "Margen": 0,
      "Precio Venta": 33,
      "Precio Venta Unit Iva Inc": 37.29,
      "Descuento": "NO",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-144201",
      "Descripcion": "FILTRO DE DIESEL PRIMARIO",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 21,
      "Precio Unit Iva Inc": 23.73,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 21,
      "Precio Venta Unit Iva Inc": 23.73,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-144250",
      "Descripcion": "FILTRO DE DIESEL SECUNDARIO",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 22,
      "Precio Unit Iva Inc": 24.86,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 22,
      "Precio Venta Unit Iva Inc": 24.86,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-144330",
      "Descripcion": "FILTRO DIESEL TRAMPA",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 23,
      "Precio Unit Iva Inc": 25.99,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 23,
      "Precio Venta Unit Iva Inc": 25.99,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-144409",
      "Descripcion": "FILTRO DE ACEITE",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 23,
      "Precio Unit Iva Inc": 25.99,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 23,
      "Precio Venta Unit Iva Inc": 25.99,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-144434",
      "Descripcion": "PARABRISAS",
      "Presentacion": "12345",
      "Division": "8001",
      "Categoría": "800104",
      "Precio Unit": 220,
      "Precio Unit Iva Inc": 248.6,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 220,
      "Precio Venta Unit Iva Inc": 248.6,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-144524",
      "Descripcion": "ACEITE DE MOTOR 15W40 CK4 MOBIL 1300",
      "Presentacion": "0",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 14.5,
      "Precio Unit Iva Inc": 16.385,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 14.5,
      "Precio Venta Unit Iva Inc": 16.385,
      "Descuento": "SI",
      "Minimos": 1,
      "Notas Producto": "MOBIL CK4",
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-150642",
      "Descripcion": "FILTRO DE AIRE",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 22.18,
      "Precio Unit Iva Inc": 25.0634,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 22.18,
      "Precio Venta Unit Iva Inc": 25.0634,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-151014",
      "Descripcion": "ENGRASE GENERAL",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100103",
      "Precio Unit": 21,
      "Precio Unit Iva Inc": 23.73,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 21,
      "Precio Venta Unit Iva Inc": 23.73,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-155215",
      "Descripcion": "FRICCION",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "100104",
      "Precio Unit": 20,
      "Precio Unit Iva Inc": 22.6,
      "Barra": "FRICCION",
      "Fecha Creacion": 46021,
      "Margen": 0.25,
      "Precio Venta": 25,
      "Precio Venta Unit Iva Inc": 28.25,
      "Descuento": "SI",
      "Minimos": 5,
      "Aplicación ": "Cabezal 30 T",
      "Usuario": "TEC-CS-181025-100910"
    },
    {
      "ID_ Producto": "PROD-CS-301225-163634",
      "Descripcion": "PINES DE MUÑONES",
      "Presentacion": "2",
      "Division": "a9119c93",
      "Categoría": "38213cbe",
      "Precio Unit": 115,
      "Precio Unit Iva Inc": 129.95,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 115,
      "Precio Venta Unit Iva Inc": 129.95,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-164029",
      "Descripcion": "TORNO, INSTALACION DE MUÑONES",
      "Presentacion": "12345",
      "Division": "a9119c93",
      "Categoría": "38213cbe",
      "Precio Unit": 190,
      "Precio Unit Iva Inc": 214.7,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 190,
      "Precio Venta Unit Iva Inc": 214.7,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-164152",
      "Descripcion": "TORNO, RECONSTRUIR TERCER BRAZO",
      "Presentacion": "12345",
      "Division": "a9119c93",
      "Categoría": "38213cbe",
      "Precio Unit": 90,
      "Precio Unit Iva Inc": 101.7,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 90,
      "Precio Venta Unit Iva Inc": 101.7,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-164251",
      "Descripcion": "ALINEADO Y BALANCEO",
      "Presentacion": "12345",
      "Division": "a9119c93",
      "Categoría": "38213cbe",
      "Precio Unit": 69,
      "Precio Unit Iva Inc": 77.97,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 69,
      "Precio Venta Unit Iva Inc": 77.97,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-170514",
      "Descripcion": "AMORTIGUADORES DELANTEROS",
      "Presentacion": "12345",
      "Division": "a9119c93",
      "Categoría": "100103",
      "Precio Unit": 45,
      "Precio Unit Iva Inc": 50.85,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 45,
      "Precio Venta Unit Iva Inc": 50.85,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-172416",
      "Descripcion": "ROTACION DE LLANTAS",
      "Presentacion": "123456",
      "Division": "a9119c93",
      "Categoría": "100103",
      "Precio Unit": 8,
      "Precio Unit Iva Inc": 9.04,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 8,
      "Precio Venta Unit Iva Inc": 9.04,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-171836",
      "Descripcion": "ACEITE DE MOTOR 0W-20 FULL SINTETIC",
      "Presentacion": "19",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 59.37,
      "Precio Unit Iva Inc": 67.0881,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 59.37,
      "Precio Venta Unit Iva Inc": 67.0881,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-174333",
      "Descripcion": "ESPEJO RETROVISOR",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "800101",
      "Precio Unit": 60,
      "Precio Unit Iva Inc": 67.8,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 60,
      "Precio Venta Unit Iva Inc": 67.8,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-301225-173850",
      "Descripcion": "REPARACION DE INYECTORES",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 150,
      "Precio Unit Iva Inc": 169.5,
      "Fecha Creacion": 46021,
      "Margen": 0,
      "Precio Venta": 150,
      "Precio Venta Unit Iva Inc": 169.5,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-020126-142404",
      "Descripcion": "RODOS DE CORTINA",
      "Presentacion": "12345",
      "Division": "Carroceria",
      "Categoría": "50320775",
      "Precio Unit": 15,
      "Precio Unit Iva Inc": 16.95,
      "Fecha Creacion": 46024,
      "Margen": 0,
      "Precio Venta": 15,
      "Precio Venta Unit Iva Inc": 16.95,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-020126-151135",
      "Descripcion": "Bujes de cabina",
      "Presentacion": "12345",
      "Division": "Carroceria",
      "Categoría": "100103",
      "Precio Unit": 83.75,
      "Precio Unit Iva Inc": 94.6375,
      "Fecha Creacion": 46024,
      "Margen": 0,
      "Precio Venta": 92.125,
      "Precio Venta Unit Iva Inc": 104.1012,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-020126-151538",
      "Descripcion": "Sello de masa",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "38213cbe",
      "Precio Unit": 32.29,
      "Precio Unit Iva Inc": 36.4877,
      "Fecha Creacion": 46024,
      "Margen": 0,
      "Precio Venta": 32.29,
      "Precio Venta Unit Iva Inc": 36.4877,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-020126-153609",
      "Descripcion": "Torno",
      "Presentacion": "12345",
      "Division": "Carroceria",
      "Categoría": "200103",
      "Precio Unit": 45,
      "Precio Unit Iva Inc": 50.85,
      "Fecha Creacion": 46024,
      "Margen": 0,
      "Precio Venta": 45,
      "Precio Venta Unit Iva Inc": 50.85,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-020126-160906",
      "Descripcion": "Refrigerante dello rojo",
      "Presentacion": "3",
      "Division": "1001",
      "Categoría": "300103",
      "Precio Unit": 11.95,
      "Precio Unit Iva Inc": 13.5035,
      "Fecha Creacion": 46024,
      "Margen": 0,
      "Precio Venta": 11.95,
      "Precio Venta Unit Iva Inc": 13.5035,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-020126-155918",
      "Descripcion": "Deposito de nivel de refrigerante",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 270,
      "Precio Unit Iva Inc": 305.1,
      "Fecha Creacion": 46024,
      "Margen": 0,
      "Precio Venta": 270,
      "Precio Venta Unit Iva Inc": 305.1,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-020126-155751",
      "Descripcion": "Maxifreno tipo 30",
      "Presentacion": "12345",
      "Division": "Sistema de frenos",
      "Categoría": "100104",
      "Precio Unit": 75,
      "Precio Unit Iva Inc": 84.75,
      "Fecha Creacion": 46024,
      "Margen": 0,
      "Precio Venta": 75,
      "Precio Venta Unit Iva Inc": 84.75,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-060126-085008",
      "Descripcion": "Aceite y filtros",
      "Presentacion": "2",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 120,
      "Precio Unit Iva Inc": 135.6,
      "Fecha Creacion": 46028,
      "Margen": 0,
      "Precio Venta": 120,
      "Precio Venta Unit Iva Inc": 135.6,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-060126-085223",
      "Descripcion": "Prensa, disco, balero collarin",
      "Presentacion": "2",
      "Division": "1001",
      "Categoría": "100102",
      "Precio Unit": 418,
      "Precio Unit Iva Inc": 472.34,
      "Fecha Creacion": 46028,
      "Margen": 0,
      "Precio Venta": 418,
      "Precio Venta Unit Iva Inc": 472.34,
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-060126-085337",
      "Descripcion": "Calibracion de prensa",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "56e316b1",
      "Precio Unit": 25,
      "Precio Unit Iva Inc": 28.25,
      "Fecha Creacion": 46028,
      "Margen": 0,
      "Precio Venta": 25,
      "Precio Venta Unit Iva Inc": 28.25,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-060126-091759",
      "Descripcion": "Sondeo de radiador",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "220ba18d",
      "Precio Unit": 70,
      "Precio Unit Iva Inc": 79.1,
      "Fecha Creacion": 46028,
      "Margen": 0,
      "Precio Venta": 70,
      "Precio Venta Unit Iva Inc": 79.1,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-070126-170353",
      "Descripcion": "pernos",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "78efec4f",
      "Precio Unit": 1,
      "Precio Unit Iva Inc": 1.13,
      "Fecha Creacion": 46029,
      "Margen": 0,
      "Precio Venta": 1,
      "Precio Venta Unit Iva Inc": 1.13,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-080126-181604",
      "Descripcion": "Kit de resortes de friccion",
      "Presentacion": "2",
      "Division": "1001",
      "Categoría": "100104",
      "Precio Unit": 21.25,
      "Precio Unit Iva Inc": 24.0125,
      "Fecha Creacion": 46030,
      "Margen": 0,
      "Precio Venta": 21.25,
      "Precio Venta Unit Iva Inc": 24.0125,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-080126-182011",
      "Descripcion": "Kit de filtro de diesel DD15",
      "Presentacion": "2",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 164.42,
      "Precio Unit Iva Inc": 185.7946,
      "Fecha Creacion": 46030,
      "Margen": 0,
      "Precio Venta": 164.42,
      "Precio Venta Unit Iva Inc": 185.7946,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-080126-182146",
      "Descripcion": "Aceite 85W140",
      "Presentacion": "3",
      "Division": "1001",
      "Categoría": "300101",
      "Precio Unit": 24,
      "Precio Unit Iva Inc": 27.12,
      "Fecha Creacion": 46030,
      "Margen": 0,
      "Precio Venta": 24,
      "Precio Venta Unit Iva Inc": 27.12,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-130126-143108",
      "Descripcion": "varios",
      "Presentacion": "2",
      "Division": "1001",
      "Categoría": "78efec4f",
      "Precio Unit": 75,
      "Precio Unit Iva Inc": 84.75,
      "Fecha Creacion": 46035,
      "Margen": 0,
      "Precio Venta": 75,
      "Precio Venta Unit Iva Inc": 84.75,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-130126-142959",
      "Descripcion": "Esquinera",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "78efec4f",
      "Precio Unit": 120,
      "Precio Unit Iva Inc": 135.6,
      "Fecha Creacion": 46035,
      "Margen": 0,
      "Precio Venta": 120,
      "Precio Venta Unit Iva Inc": 135.6,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-130126-083846",
      "Descripcion": "Pintura",
      "Presentacion": "2",
      "Division": "1001",
      "Categoría": "78efec4f",
      "Precio Unit": 250,
      "Precio Unit Iva Inc": 282.5,
      "Fecha Creacion": 46035,
      "Margen": 0,
      "Precio Venta": 250,
      "Precio Venta Unit Iva Inc": 282.5,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-130126-083711",
      "Descripcion": "Via   L",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "100105",
      "Precio Unit": 239.95,
      "Precio Unit Iva Inc": 271.1435,
      "Fecha Creacion": 46035,
      "Margen": 0,
      "Precio Venta": 239.95,
      "Precio Venta Unit Iva Inc": 271.1435,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-130126-083503",
      "Descripcion": "Farol   L",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "100105",
      "Precio Unit": 244.64,
      "Precio Unit Iva Inc": 276.4432,
      "Fecha Creacion": 46035,
      "Margen": 0,
      "Precio Venta": 244.64,
      "Precio Venta Unit Iva Inc": 276.4432,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-150126-085844",
      "Descripcion": "Foco de via",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "100105",
      "Precio Unit": 5,
      "Precio Unit Iva Inc": 5.65,
      "Fecha Creacion": 46037,
      "Margen": 0,
      "Precio Venta": 5,
      "Precio Venta Unit Iva Inc": 5.65,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-150912",
      "Descripcion": "Aceite ATF",
      "Presentacion": "4",
      "Division": "1001",
      "Categoría": "300101",
      "Precio Unit": 11.25,
      "Precio Unit Iva Inc": 12.7125,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 11.25,
      "Precio Venta Unit Iva Inc": 12.7125,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-150736",
      "Descripcion": "Valvula check de chimbo",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "100103",
      "Precio Unit": 34.37,
      "Precio Unit Iva Inc": 38.8381,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 34.37,
      "Precio Venta Unit Iva Inc": 38.8381,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-150646",
      "Descripcion": "Valvula de suspensión de bolsas",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100103",
      "Precio Unit": 88.12,
      "Precio Unit Iva Inc": 99.5756,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 88.12,
      "Precio Venta Unit Iva Inc": 99.5756,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-150556",
      "Descripcion": "Soporte de capo",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "78efec4f",
      "Precio Unit": 53.84,
      "Precio Unit Iva Inc": 60.8392,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 53.84,
      "Precio Venta Unit Iva Inc": 60.8392,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-145619",
      "Descripcion": "Aceite 15w40 CK4",
      "Presentacion": "PRES-CS-080126-182222",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 145,
      "Precio Unit Iva Inc": 163.85,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 145,
      "Precio Venta Unit Iva Inc": 163.85,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-154001",
      "Descripcion": "Faja de A/C",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 28,
      "Precio Unit Iva Inc": 31.64,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 28,
      "Precio Venta Unit Iva Inc": 31.64,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-153613",
      "Descripcion": "Faja de motor",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 23.23,
      "Precio Unit Iva Inc": 26.2499,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 23.23,
      "Precio Venta Unit Iva Inc": 26.2499,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-153051",
      "Descripcion": "Faja de power steering",
      "Presentacion": "12345",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 25,
      "Precio Unit Iva Inc": 28.25,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 25,
      "Precio Venta Unit Iva Inc": 28.25,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-220126-165642",
      "Descripcion": "termo swicht",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "100105",
      "Precio Unit": 60,
      "Precio Unit Iva Inc": 67.8,
      "Fecha Creacion": 46044,
      "Margen": 0,
      "Precio Venta": 60,
      "Precio Venta Unit Iva Inc": 67.8,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    },
    {
      "ID_ Producto": "PROD-CS-280126-180210",
      "Descripcion": "Power steering",
      "Presentacion": "1",
      "Division": "1001",
      "Categoría": "100101",
      "Precio Unit": 290,
      "Precio Unit Iva Inc": 327.7,
      "Fecha Creacion": 46050,
      "Margen": 0,
      "Precio Venta": 290,
      "Precio Venta Unit Iva Inc": 327.7,
      "Descuento": "SI",
      "Minimos": 1,
      "Usuario": "TEC-CS-151225-083151"
    }
  ],
  "mano_obra": [
    {
      "ID_ManoObra": 320001,
      "Descripcion": "Mecanica Varios",
      "Categoria": "MO001",
      "PrecioUnitario": 0,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 45917.91645833333,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": 320002,
      "Descripcion": "Soldadura varios",
      "Categoria": "MO001",
      "PrecioUnitario": 0,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 45930.84508101852,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": 320003,
      "Descripcion": "Electricidad Varios",
      "Categoria": "MO001",
      "PrecioUnitario": 0,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 45941.84508101852,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": 320004,
      "Descripcion": "Lavado Varios",
      "Categoria": "MO001",
      "PrecioUnitario": 0,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 45953.84508101852,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": 320005,
      "Descripcion": "Tornos Varios",
      "Categoria": "MO001",
      "PrecioUnitario": 0,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 45968.84508101852,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": 320006,
      "Descripcion": "Enderezado varios",
      "Categoria": "MO001",
      "PrecioUnitario": 0,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 45979.84508101852,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": 320007,
      "Descripcion": "Servicios varios",
      "Categoria": "MO001",
      "PrecioUnitario": 0,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 46005.84508101852,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": 320250,
      "Descripcion": "Desmontaje varios",
      "Categoria": "MO001",
      "PrecioUnitario": 6.07,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "NO",
      "AplicaIVA": "SI",
      "FechaCreacion": 46114.84508101852,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": "MO-CS-151225-134041",
      "Descripcion": "Cambio de aceite y filtros",
      "Categoria": "MO004",
      "PrecioUnitario": 20,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "NO",
      "AplicaIVA": "SI",
      "FechaCreacion": 46006.569918981484,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": "MO-CS-151225-134406",
      "Descripcion": "Cambio de soporte de cardan",
      "Categoria": "MO001",
      "PrecioUnitario": 45,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 46006.572291666664,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": "MO-CS-151225-134651",
      "Descripcion": "Cambio de fricciones",
      "Categoria": "MO006",
      "PrecioUnitario": 25,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 46006.57420138889,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": "MO-CS-151225-135023",
      "Descripcion": "Cambio de sello de bufa",
      "Categoria": "MO001",
      "PrecioUnitario": 45,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 46006.57665509259,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": "MO-CS-151225-135059",
      "Descripcion": "Cambio de sello de masa",
      "Categoria": "Direccion",
      "PrecioUnitario": 45,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 46006.57707175926,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": "MO-CS-151225-135701",
      "Descripcion": "Cambio de cruceta",
      "Categoria": "Carroceria",
      "PrecioUnitario": 35,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 46006.58126157407,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": "MO-CS-151225-135830",
      "Descripcion": "Cambio de soportes de motor traseros",
      "Categoria": "Carroceria",
      "PrecioUnitario": 60,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 46006.582291666666,
      "Estado": "Activo"
    },
    {
      "ID_ManoObra": "MO-CS-301225-173603",
      "Descripcion": "CAMBIO DE INYECTORES",
      "Categoria": "MOTOR",
      "PrecioUnitario": 80,
      "UnidadMedida": "Servicio",
      "PrecioEditable": "SI",
      "AplicaIVA": "SI",
      "FechaCreacion": 46021.73336805555,
      "Estado": "Activo"
    }
  ],
  "presupuestos": [
    {
      "ID Presupuesto": "PRES-CS-151225-070603",
      "Fecha": 46006,
      "Codigo_Cliente": "CLIENT-CS-121225-203446",
      "Nombre": "DAVID ANTONIO MEJIA RAMIERZ",
      "Telefono 1 ": "78150614",
      "Direccion": "Res las Colinas, Senda Las Margaritas Cas a #13",
      "ID_Vehiculo": "VEHICULO-CS-151225-070607",
      "Placas": "P 115598",
      "Kilometraje": "625,000  KM",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CONTADO",
      "Contador": 20,
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-151225-07060320.pdf",
      "Tecnico Asignado": "TEC-CS-181025-100910",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-181025-100910",
      "Fecha Facturacion": 46006,
      "Pagado?": "SI",
      "Fallas Detectadas": "Reparación completa de Motor, Reconstrucción de Caja  y Reparación y limpieza de Frenos.",
      "Fecha Prometida": 46021
    },
    {
      "ID Presupuesto": "PRES-CS-151225-142817",
      "Fecha": 46006,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-151225-142817.pdf",
      "_API_Response_": "DTE-03-M001P001-001765832540110",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46006,
      "Pagado?": "SI",
      "Fallas Detectadas": "Fricciones delanteras dañadas",
      "Fecha Prometida": 46006
    },
    {
      "ID Presupuesto": "PRES-CS-301225-143639",
      "Fecha": 46008,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-143712",
      "Placas": "C124416",
      "Kilometraje": "93734",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Contador": 2,
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-301225-1436392.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000001",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46021,
      "Pagado?": "SI",
      "Fallas Detectadas": "MANTENIMIENTO PREVENTIVO",
      "Fecha Prometida": 46008
    },
    {
      "ID Presupuesto": "PRES-CS-301225-163443",
      "Fecha": 46021,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-155729",
      "Placas": "C130847",
      "Kilometraje": "58206",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-301225-163443.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000002",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46021,
      "Pagado?": "SI",
      "Fallas Detectadas": "MUÑONES DE DIRECCION DAÑADOS",
      "Fecha Prometida": 46014
    },
    {
      "ID Presupuesto": "PRES-CS-301225-165952",
      "Fecha": 46021,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-155729",
      "Placas": "C130847",
      "Kilometraje": "58206",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-301225-165952.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000003",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46021,
      "Pagado?": "SI",
      "Fallas Detectadas": "MANTENIMIENTO PREVENTIVO",
      "Fecha Prometida": 46014
    },
    {
      "ID Presupuesto": "PRES-CS-301225-171731",
      "Fecha": 46021,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-171407",
      "Placas": "P5180F",
      "Kilometraje": "45160",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-301225-171731.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000004",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46021,
      "Pagado?": "SI",
      "Fallas Detectadas": "MANTENIMIENTO PREVENTIVO",
      "Fecha Prometida": 46011
    },
    {
      "ID Presupuesto": "PRES-CS-301225-173742",
      "Fecha": 46021,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-173214",
      "Placas": "C130693",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-301225-173742.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000005",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46021,
      "Pagado?": "SI",
      "Fallas Detectadas": "FALLO EN SISTEMA DE INYECCION DE MOTOR",
      "Fecha Prometida": 46014
    },
    {
      "ID Presupuesto": "PRES-CS-301225-175357",
      "Fecha": 46021,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-175138",
      "Placas": "C124419",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-301225-175357.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000006",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46021,
      "Pagado?": "SI",
      "Fallas Detectadas": "PARABRISAS DAÑADO",
      "Fecha Prometida": 46020
    },
    {
      "ID Presupuesto": "PRES-CS-020126-142326",
      "Fecha": 46024,
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "70190993",
      "Direccion": "AV. BERNAL Y CALLE LOS SISIMILES, COL. MIRAMONTE, #592",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020126-132412",
      "Placas": "C117556",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020126-142326.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000003",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46027,
      "Pagado?": "SI",
      "Fallas Detectadas": "FALLO EN CLUCHT",
      "Fecha Prometida": 46027
    },
    {
      "ID Presupuesto": "PRES-CS-020126-143627",
      "Fecha": 46024,
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "70190993",
      "Direccion": "AV. BERNAL Y CALLE LOS SISIMILES, COL. MIRAMONTE, #592",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020126-140936",
      "Placas": "C126126",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020126-143627.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000004",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46027,
      "Pagado?": "SI",
      "Fallas Detectadas": "FALLO EN CORTINA",
      "Fecha Prometida": 46027
    },
    {
      "ID Presupuesto": "PRES-CS-020126-150903",
      "Fecha": 46024,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020126-145043",
      "Placas": "C124549",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020126-150903.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000001",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46024,
      "Pagado?": "SI",
      "Fallas Detectadas": "GOLPE EN CABINA, FUGA DE ACEITE EN DIRECCION Y FALLO EN LUCES",
      "Fecha Prometida": 46027
    },
    {
      "ID Presupuesto": "PRES-CS-020126-155618",
      "Fecha": 46024,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020126-155332",
      "Placas": "C132216",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020126-155618.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000002",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46024,
      "Pagado?": "SI",
      "Fallas Detectadas": "Maxifreno dañado, Deposito de nivel de refrigerante dañado",
      "Fecha Prometida": 46013
    },
    {
      "ID Presupuesto": "PRES-CS-030126-143421",
      "Fecha": 46025,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-030126-142844",
      "Placas": "C138147",
      "Kilometraje": "1032467",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Contador": 1,
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-030126-1434211.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000006",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46030,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo,  fricciones malas, diagnostico de motor",
      "Fecha Prometida": 46027
    },
    {
      "ID Presupuesto": "PRES-CS-050126-143819",
      "Fecha": 46027,
      "Codigo_Cliente": "CLIENT-CS-050126-142549",
      "Nombre": "DROGUERIA NUEVA SAN CARLOS, S.A. DE C.V.",
      "Telefono 1 ": "22127200",
      "Direccion": "POLIG, G, LOTE 1, PLAN DE LA LAGUNA",
      "Categoría Contribuyente": "GRANDE",
      "ID_Vehiculo": "VEHICULO-CS-050126-143552",
      "Placas": "P969888",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-050126-143819.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000009",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46042,
      "Pagado?": "SI"
    },
    {
      "ID Presupuesto": "PRES-CS-060126-091636",
      "Fecha": 46028,
      "Codigo_Cliente": "CLIENT-CS-050126-142549",
      "Nombre": "DROGUERIA NUEVA SAN CARLOS, S.A. DE C.V.",
      "Telefono 1 ": "22127200",
      "Direccion": "POLIG, G, LOTE 1, PLAN DE LA LAGUNA",
      "Categoría Contribuyente": "GRANDE",
      "ID_Vehiculo": "VEHICULO-CS-060126-091215",
      "Placas": "P686858",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Contador": 3,
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-060126-0916363.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000010",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46042,
      "Pagado?": "SI",
      "Fallas Detectadas": "Calentamiento de motor por termostatos y radiador dañados"
    },
    {
      "ID Presupuesto": "PRES-CS-070126-165856",
      "Fecha": 46029,
      "Codigo_Cliente": "CLIENT-CS-070126-164307",
      "Nombre": "AGUILAR ESQUIVEL, OSCAR ORLANDO",
      "Telefono 1 ": "77416665",
      "Direccion": "RESIDENCIAL VILLA NEJAPA POLIG, 1 CASA 21, NEJAPA",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-070126-165647",
      "Placas": "C128925",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CONTADO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000005",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46029,
      "Pagado?": "SI",
      "Fallas Detectadas": "Activacion de equipo",
      "Fecha Prometida": 46029
    },
    {
      "ID Presupuesto": "PRES-CS-130126-082952",
      "Fecha": 46035,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-173214",
      "Placas": "C130693",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Contador": 1,
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-130126-0829521.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000105",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46160,
      "Pagado?": "NO",
      "Fallas Detectadas": "Golpe en puerta",
      "Fecha Prometida": 46035
    },
    {
      "ID Presupuesto": "PRES-CS-150126-081900",
      "Fecha": 46037,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-150126-081923",
      "Placas": "C136713",
      "Kilometraje": "449810.7 m",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-150126-081900.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000007",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46037,
      "Pagado?": "SI",
      "Fallas Detectadas": "mantenimiento preventivo",
      "Fecha Prometida": 46029
    },
    {
      "ID Presupuesto": "PRES-CS-150126-084548",
      "Fecha": 46037,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020126-145043",
      "Placas": "C124549",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-150126-084548.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000008",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46037,
      "Pagado?": "SI",
      "Fallas Detectadas": "Fallo en sistema eléctrico",
      "Fecha Prometida": 46036
    },
    {
      "ID Presupuesto": "PRES-CS-150126-085731",
      "Fecha": 46037,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-150126-085557",
      "Placas": "C134716",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Pendiente",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Pagado?": "NO",
      "Fallas Detectadas": "Sistema Electrico",
      "Fecha Prometida": 46036
    },
    {
      "ID Presupuesto": "PRES-CS-210126-145803",
      "Fecha": 46043,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-144930",
      "Placas": "C131268",
      "Kilometraje": "2081145",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-210126-145803.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000011",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46044,
      "Pagado?": "SI",
      "Fecha Prometida": 46038
    },
    {
      "ID Presupuesto": "PRES-CS-220126-152314",
      "Fecha": 46044,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-152516",
      "Placas": "P70E08",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-220126-152314.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000012",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46044,
      "Pagado?": "SI",
      "Fallas Detectadas": "Base quebrada de compresor de A/C"
    },
    {
      "ID Presupuesto": "PRES-CS-220126-155612",
      "Fecha": 46044,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-155627",
      "Placas": "P825A2",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-220126-155612.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000013",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46044,
      "Pagado?": "SI",
      "Fallas Detectadas": "Base de compersor de A/C quebrada"
    },
    {
      "ID Presupuesto": "PRES-CS-220126-163529",
      "Fecha": 46044,
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "24070992",
      "Direccion": "KM 31 CALLE A SAN SALVADOR, CTON, FRENTA A IGLESIA PROFETICA, LOTE 4 Y 5,",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-163536",
      "Placas": "C138771",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-220126-163529.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000014",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46044,
      "Pagado?": "SI",
      "Fallas Detectadas": "Equipo no enciende"
    },
    {
      "ID Presupuesto": "PRES-CS-220126-164258",
      "Fecha": 46044,
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "24070992",
      "Direccion": "KM 31 CALLE A SAN SALVADOR, CTON, FRENTA A IGLESIA PROFETICA, LOTE 4 Y 5,",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-164305",
      "Placas": "C138798",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-220126-164258.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000015",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46044,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento General"
    },
    {
      "ID Presupuesto": "PRES-CS-260126-185349",
      "Fecha": 46048,
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "70190993",
      "Direccion": "AV. BERNAL Y CALLE LOS SISIMILES, COL. MIRAMONTE, #592",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-260126-184010",
      "Placas": "RE4889",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-260126-185349.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000016",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46048,
      "Pagado?": "SI",
      "Fallas Detectadas": "falla en sistema de frenos",
      "Fecha Prometida": 46042
    },
    {
      "ID Presupuesto": "PRES-CS-280126-145711",
      "Fecha": 46050,
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "24070992",
      "Direccion": "KM 31 CALLE A SAN SALVADOR, CTON, FRENTA A IGLESIA PROFETICA, LOTE 4 Y 5,",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-164305",
      "Placas": "C138798",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CONTADO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000017",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46050,
      "Pagado?": "SI",
      "Fallas Detectadas": "Maxifreno dañado, eliminar mangueras de calefacción",
      "Fecha Prometida": 46050
    },
    {
      "ID Presupuesto": "PRES-CS-280126-164440",
      "Fecha": 46050,
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "24070992",
      "Direccion": "KM 31 CALLE A SAN SALVADOR, CTON, FRENTA A IGLESIA PROFETICA, LOTE 4 Y 5,",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-163536",
      "Placas": "C138771",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CONTADO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000018",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46050,
      "Pagado?": "SI",
      "Fallas Detectadas": "Instalación de válvulas de paso de combustible",
      "Fecha Prometida": 46046
    },
    {
      "ID Presupuesto": "PRES-CS-280126-165001",
      "Fecha": 46050,
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "24070992",
      "Direccion": "KM 31 CALLE A SAN SALVADOR, CTON, FRENTA A IGLESIA PROFETICA, LOTE 4 Y 5,",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-280126-165010",
      "Placas": "RE 9358",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CONTADO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000019",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46050,
      "Pagado?": "SI",
      "Fecha Prometida": 46046
    },
    {
      "ID Presupuesto": "PRES-CS-280126-171741",
      "Fecha": 46050,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-173214",
      "Placas": "C130693",
      "Kilometraje": "64,129",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-280126-171741.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000020",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46050,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46048
    },
    {
      "ID Presupuesto": "PRES-CS-280126-172511",
      "Fecha": 46050,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-280126-172544",
      "Placas": "C126672",
      "Kilometraje": "832349.2 M",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-280126-172511.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000021",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46050,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46045
    },
    {
      "ID Presupuesto": "PRES-CS-040226-090509",
      "Fecha": 46057,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-040226-090533",
      "Placas": "C131954",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000022",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46057,
      "Pagado?": "SI",
      "Fallas Detectadas": "Soporte de cabina dañadp",
      "Fecha Prometida": 46051
    },
    {
      "ID Presupuesto": "PRES-CS-070226-135338",
      "Fecha": 46060,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-144930",
      "Placas": "C131268",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-070226-135338.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000024",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46060,
      "Pagado?": "SI",
      "Fallas Detectadas": "Falla electrica y fuga en masa de direccion",
      "Fecha Prometida": 46057
    },
    {
      "ID Presupuesto": "PRES-CS-070226-140746",
      "Fecha": 46060,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-152516",
      "Placas": "P70E08",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-070226-140746.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000025",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46060,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46059
    },
    {
      "ID Presupuesto": "PRES-CS-100226-090045",
      "Fecha": 46063,
      "Codigo_Cliente": "CLIENT-CS-040226-083534",
      "Nombre": "Monica Liliana, Sanchez de Carcamo",
      "Telefono 1 ": "78609289",
      "Direccion": "calle principal polig A, col. loma linda cton, las moras #8",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-100226-090054",
      "Placas": "C124611",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000023",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46063,
      "Pagado?": "SI",
      "Fallas Detectadas": "Fricciones dañadas",
      "Fecha Prometida": 46045
    },
    {
      "ID Presupuesto": "PRES-CS-160226-091414",
      "Fecha": 46069,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-160226-091430",
      "Placas": "Poliza",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Contador": 1,
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-160226-0914141.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000057",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46104,
      "Pagado?": "SI",
      "Fallas Detectadas": "Activación de equipo",
      "Fecha Prometida": 46069
    },
    {
      "ID Presupuesto": "PRES-CS-160226-103739",
      "Fecha": 46069,
      "Codigo_Cliente": "CLIENT-CS-040226-083534",
      "Nombre": "Monica Liliana, Sanchez de Carcamo",
      "Telefono 1 ": "78609289",
      "Direccion": "calle principal polig A, col. loma linda cton, las moras #8",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-160226-104324",
      "Placas": "C117696",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000026",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46069,
      "Pagado?": "SI",
      "Fallas Detectadas": "Sello de bufa dañado",
      "Fecha Prometida": 46066
    },
    {
      "ID Presupuesto": "PRES-CS-160226-112024",
      "Fecha": 46069,
      "Codigo_Cliente": "CLIENT-CS-040226-083534",
      "Nombre": "Monica Liliana, Sanchez de Carcamo",
      "Telefono 1 ": "78609289",
      "Direccion": "calle principal polig A, col. loma linda cton, las moras #8",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-160226-112032",
      "Placas": "C121689",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000027",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46069,
      "Pagado?": "SI",
      "Fallas Detectadas": "Fricciones dañadas",
      "Fecha Prometida": 46064
    },
    {
      "ID Presupuesto": "PRES-CS-190226-163449",
      "Fecha": 46072,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-171407",
      "Placas": "P5180F",
      "Kilometraje": "50635",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-190226-163449.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000035",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46073,
      "Pagado?": "SI",
      "Fallas Detectadas": "MANTENIMIENTO PREVENTIVO",
      "Fecha Prometida": 46065
    },
    {
      "ID Presupuesto": "PRES-CS-190226-171819",
      "Fecha": 46072,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-190226-171926",
      "Placas": "C124427",
      "Kilometraje": "93797",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-190226-171819.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000036",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46073,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento Preventivo",
      "Fecha Prometida": 46066
    },
    {
      "ID Presupuesto": "PRES-CS-190226-174656",
      "Fecha": 46072,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-175138",
      "Placas": "C124419",
      "Kilometraje": "101805",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-190226-174656.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000037",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46073,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46067
    },
    {
      "ID Presupuesto": "PRES-CS-190226-180109",
      "Fecha": 46072,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-143712",
      "Placas": "C124416",
      "Kilometraje": "99800",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-190226-180109.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000038",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46073,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46070
    },
    {
      "ID Presupuesto": "PRES-CS-190226-181302",
      "Fecha": 46072,
      "Codigo_Cliente": "CLIENT-CS-151225-135911",
      "Nombre": "COTRANS, S.A. DE C.V.",
      "Telefono 1 ": "22126267",
      "Direccion": "CALLE AL PUERTO DE LA LIBERTAD KM. 10",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-301225-155729",
      "Placas": "C130847",
      "Kilometraje": "64407",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-190226-181302.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000039",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46073,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46070
    },
    {
      "ID Presupuesto": "PRES-CS-020326-145845",
      "Fecha": 46083,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020126-155332",
      "Placas": "C132216",
      "Kilometraje": "952493",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020326-145845.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000045",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46083,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46081
    },
    {
      "ID Presupuesto": "PRES-CS-020326-160311",
      "Fecha": 46083,
      "Codigo_Cliente": "CLIENT-CS-181225-094044",
      "Nombre": "INTERNATIONAL FREIGHT LOGISTICS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "70190993",
      "Direccion": "AV. BERNAL Y CALLE LOS SISIMILES, COL. MIRAMONTE, #592",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020326-160346",
      "Placas": "C126710",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020326-160311.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000048",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46083,
      "Pagado?": "SI",
      "Fallas Detectadas": "Maxifreno dañado",
      "Fecha Prometida": 46079
    },
    {
      "ID Presupuesto": "PRES-CS-020326-162617",
      "Fecha": 46083,
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "24070992",
      "Direccion": "KM 31 CALLE A SAN SALVADOR, CTON, FRENTA A IGLESIA PROFETICA, LOTE 4 Y 5,",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-220126-164305",
      "Placas": "C138798",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020326-162617.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000050",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46083,
      "Pagado?": "SI",
      "Fallas Detectadas": "Maxifreno dañado",
      "Fecha Prometida": 46080
    },
    {
      "ID Presupuesto": "PRES-CS-020326-162906",
      "Fecha": 46083,
      "Codigo_Cliente": "CLIENT-CS-220126-161857",
      "Nombre": "GRUPO PALACIOS, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "24070992",
      "Direccion": "KM 31 CALLE A SAN SALVADOR, CTON, FRENTA A IGLESIA PROFETICA, LOTE 4 Y 5,",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-280126-165010",
      "Placas": "RE 9358",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020326-162906.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000049",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Pagado?": "SI",
      "Fallas Detectadas": "Sello dañado",
      "Fecha Prometida": 46074
    },
    {
      "ID Presupuesto": "PRES-CS-020326-172237",
      "Fecha": 46083,
      "Codigo_Cliente": "CLIENT-CS-040226-083534",
      "Nombre": "Monica Liliana, Sanchez de Carcamo",
      "Telefono 1 ": "78609289",
      "Direccion": "calle principal polig A, col. loma linda cton, las moras #8",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-100226-090054",
      "Placas": "C124611",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Pendiente",
      "_API_Response_": "DTE-03-M001P001-000000000000051",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46083,
      "Pagado?": "NO",
      "Fallas Detectadas": "Yugo dañado",
      "Fecha Prometida": 46070
    },
    {
      "ID Presupuesto": "PRES-CS-020326-175407",
      "Fecha": 46083,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020326-175426",
      "Placas": "C129928",
      "Kilometraje": "344970",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-020326-175407.pdf",
      "_API_Response_": "DTE-03-M001P001-000000000000052",
      "Doc a Emitir": "CREDITO FISCAL",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46086,
      "Pagado?": "SI",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46083
    },
    {
      "ID Presupuesto": "PRES-CS-190326-075043",
      "Fecha": 46100,
      "Codigo_Cliente": "CLIENT-CS-020126-144100",
      "Nombre": "KALTMANN, SOCIEDAD ANONIMA DE CAPITAL VARIABLE",
      "Telefono 1 ": "22434348",
      "Direccion": "BLVD SERGIO VIERA DE MELLO, LOCAL 9, COL. SAN BENITO EDIF, CENTURY TOWER NIVEL 6, #243",
      "Categoría Contribuyente": "OTROS",
      "ID_Vehiculo": "VEHICULO-CS-020326-175426",
      "Placas": "C129928",
      "Kilometraje": "344970 km",
      "Estado": 3,
      "% Impuesto": 0.13,
      "AplicaPercepcion": 0,
      "AplicaRetencion": 0,
      "Condicion": "CREDITO",
      "Estado PDF": "Generado",
      "Archivo PDF": "/appsheet/data/MecanicOSGrupoGema-958100207/Files/PRES-CS-190326-075043.pdf",
      "Tecnico Asignado": "TEC-CS-151225-083151",
      "Orden_Compra": "0",
      "USEREMAIL()": "TEC-CS-151225-083151",
      "Fecha Facturacion": 46100,
      "Pagado?": "NO",
      "Fallas Detectadas": "Mantenimiento preventivo",
      "Fecha Prometida": 46083
    }
  ],
  "revisiones": [
    {
      "ID_Revision": "REV21-CS-170126-085658",
      "Estado Revision": "Terminada",
      "Fecha": 46039,
      "Hora": 0.37289351851851854,
      "Codigo_Cliente": "CLIENT-CS-121225-203446",
      "Correo": "ventas@forbiddensoluciones.com",
      "Telefono 1 ": "78150614",
      "ID_Vehiculo": "VEHICULO-CS-151225-070607",
      "Placas": "P 115598",
      "Marca": "19",
      "Modelo": "MODEL-CS-151225-070553",
      "Año": "2006",
      "Clase": "ce2db1e4",
      "Nª_Motor": "010203040506",
      "Nª_VIN": "010203040506",
      "Odometro": "135000",
      "Freno de Mano": "BUEN ESTADO",
      "A/C Ventilacion y filtro de cabina": "MAL ESTADO",
      "Parabrisas y Aspersores": "BUEN ESTADO",
      "Luces exteriores y pito": "MAL ESTADO",
      "Fajas": "BUEN ESTADO",
      "Nivel de Refrigerante": "BUEN ESTADO",
      "Alternador y Bateria": "BUEN ESTADO",
      "Fugas de aceite en el motor/Niveles de aceite": "NO SE OBSERVAN",
      "Fugas de aceite en caja y corona/Niveles": "NO SE OBSERVAN",
      "Liquido de Freno": "BUEN ESTADO",
      "Llantas": "BUEN ESTADO",
      "Fugas Amortiguadores": "NO SE OBSERVAN",
      "Embrague": "BUEN ESTADO",
      "Fugas de Aceite en Caja y Diferenciales": "NO SE OBSERVAN",
      "Sistema de Escape": "BUEN ESTADO",
      "Sistema de Combustible": "BUEN ESTADO",
      "Estado Amortiguadoes": "BUEN ESTADO",
      "Filtro de Aire": "BUEN ESTADO",
      "Pilotos Encendidos": "NO SE OBSERVAN",
      "Realizado por: ": "TEC-CS-181025-100910"
    }
  ],
  "tecnicos": [
    {
      "Tecnico_ID": "TEC-CS-181025-100910",
      "Nombre_Completo": "David Antonio Mejía Ramirez",
      "Email": "ventas@forbiddensoluciones.com",
      "Telefono": 781506164,
      "Nivel_Acceso": "Administrador",
      "Contraseña": "Admin123"
    },
    {
      "Tecnico_ID": "TEC-CS-151225-083151",
      "Nombre_Completo": "Johny Javier Muñoz",
      "Email": "jjmunoz923@gmail.com",
      "Telefono": "7625 0906",
      "Especialidad": "Mecánico",
      "Nivel_Acceso": "Administrador",
      "Estado_Laboral": "Activo",
      "Contraseña": "1234"
    }
  ]
};

// Database Initialization in LocalStorage
function initDatabase() {
    if (!localStorage.getItem('mecanic_os_db')) {
        localStorage.setItem('mecanic_os_db', JSON.stringify(DEFAULT_DATABASE));
    }
    
    // Check for auxiliary data
    if (!localStorage.getItem('mecanic_os_pos_cart')) {
        localStorage.setItem('mecanic_os_pos_cart', JSON.stringify([]));
    }

    if (!localStorage.getItem('mecanic_os_dte_config')) {
        localStorage.setItem('mecanic_os_dte_config', JSON.stringify({
            apiKey: '',
            ambiente: '00',
            mhCode: '0001',
            posNumber: '1',
            backendUrl: ''
        }));
    }

    // Initialize SaaS states
    const db = getDatabase();
    if (db) {
        let changed = false;
        if (!db.role_permissions) {
            db.role_permissions = {
                "Administrador": [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                    "facturador", "venta-rapida", "cuentas-cobrar", "inventario", "gastos", "planilla",
                    "dashboard-bi", "configuracion"
                ],
                "Técnico": [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "kanban"
                ],
                "Recepcionista": [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                    "venta-rapida", "cuentas-cobrar"
                ]
            };
            changed = true;
        }
        if (!db.saas_state) {
            db.saas_state = {
                status: 'guest',
                workshopData: null,
                termsSigned: false,
                signatureName: '',
                signedAt: null
            };
            changed = true;
        }
        if (!db.solicitudes_registro || db.solicitudes_registro.length === 0) {
            db.solicitudes_registro = [
                {
                    id: 'REQ-GEMA',
                    nombre: 'GRUPO GEMA, S.A. DE C.V.',
                    giro: 'Servicio de Mantenimiento al Transporte Terrestre',
                    direccion: 'Carretera al Puerto de La Libertad, Km. 10.5, Santa Tecla',
                    telefono: '2288-9900',
                    correo: 'contacto@grupogemasv.com',
                    nit: '0614-121285-101-5',
                    nrc: '190562-4',
                    logoText: 'GRUPO GEMA',
                    logoTagline: 'Transporte & Mantenimiento Especializado',
                    propietario: 'David Antonio Mejía Ramírez',
                    pass: 'admin',
                    status: 'aprobado',
                    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
                    plan: 'Enterprise',
                    precio_mensual: 120.00,
                    suscripcion_status: 'activo',
                    proximo_pago: Date.now() + 18 * 24 * 60 * 60 * 1000
                },
                {
                    id: 'REQ-ESCANDON',
                    nombre: 'Taller Automotriz Escandón',
                    giro: 'Mantenimiento y Reparación de Vehículos Automotores',
                    direccion: 'Calle El Progreso #420, San Salvador',
                    telefono: '2225-8899',
                    correo: 'contacto@tallerescandon.com',
                    nit: '0614-150692-102-1',
                    nrc: '228514-3',
                    logoText: 'ESCANDON AUTO',
                    logoTagline: 'Tu auto en manos de expertos',
                    propietario: 'Alejandro Escandón',
                    pass: '1234',
                    status: 'aprobado',
                    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
                    plan: 'Pro',
                    precio_mensual: 75.00,
                    suscripcion_status: 'activo',
                    proximo_pago: Date.now() + 10 * 24 * 60 * 60 * 1000
                },
                {
                    id: 'REQ-PROGRESO',
                    nombre: 'Multiservicios El Progreso',
                    giro: 'Servicios de Mecánica Rápida y Enderezado',
                    direccion: 'Km 12 Carretera Troncal del Norte, Apopa',
                    telefono: '2254-1234',
                    correo: 'progreso.taller@gmail.com',
                    nit: '0614-080898-105-2',
                    nrc: '185963-0',
                    logoText: 'EL PROGRESO',
                    logoTagline: 'Soluciones Rápidas y Confiables',
                    propietario: 'Mauricio Peña',
                    pass: 'apopa',
                    status: 'aprobado',
                    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
                    plan: 'Basic',
                    precio_mensual: 45.00,
                    suscripcion_status: 'suspendido',
                    proximo_pago: Date.now() - 2 * 24 * 60 * 60 * 1000
                }
            ];
            changed = true;
        }
        if (!db.saas_payments) {
            db.saas_payments = [
                {
                    id: 'PAY-1001',
                    workshopId: 'REQ-GEMA',
                    workshopName: 'GRUPO GEMA, S.A. DE C.V.',
                    plan: 'Enterprise',
                    monto: 120.00,
                    fecha: Date.now() - 55 * 24 * 60 * 60 * 1000,
                    factura: 'SUS-2026-015',
                    metodo: 'Transferencia Bancaria (Banco Agrícola)',
                    estado: 'completado'
                },
                {
                    id: 'PAY-1002',
                    workshopId: 'REQ-ESCANDON',
                    workshopName: 'Taller Automotriz Escandón',
                    plan: 'Pro',
                    monto: 75.00,
                    fecha: Date.now() - 40 * 24 * 60 * 60 * 1000,
                    factura: 'SUS-2026-024',
                    metodo: 'Efectivo',
                    estado: 'completado'
                },
                {
                    id: 'PAY-1003',
                    workshopId: 'REQ-GEMA',
                    workshopName: 'GRUPO GEMA, S.A. DE C.V.',
                    plan: 'Enterprise',
                    monto: 120.00,
                    fecha: Date.now() - 25 * 24 * 60 * 60 * 1000,
                    factura: 'SUS-2026-039',
                    metodo: 'Transferencia Bancaria (Banco Agrícola)',
                    estado: 'completado'
                },
                {
                    id: 'PAY-1004',
                    workshopId: 'REQ-ESCANDON',
                    workshopName: 'Taller Automotriz Escandón',
                    plan: 'Pro',
                    monto: 75.00,
                    fecha: Date.now() - 10 * 24 * 60 * 60 * 1000,
                    factura: 'SUS-2026-052',
                    metodo: 'Tarjeta de Crédito (Visa)',
                    estado: 'completado'
                }
            ];
            changed = true;
        }
        // Sync active workshop configurations to local storage
        if (db.saas_state && db.saas_state.workshopData) {
            const wsData = db.saas_state.workshopData;
            if (wsData.dte_config) {
                localStorage.setItem('mecanic_os_dte_config', JSON.stringify(wsData.dte_config));
            }
            if (wsData.firebase_config) {
                localStorage.setItem('mecanic_os_firebase_config', JSON.stringify(wsData.firebase_config));
            }
        }
        if (changed) {
            saveDatabase(db);
        }
    }
}

function getDatabase() {
    return JSON.parse(localStorage.getItem('mecanic_os_db'));
}

function saveDatabase(db) {
    localStorage.setItem('mecanic_os_db', JSON.stringify(db));
    if (db && db.saas_state && db.saas_state.workshopData) {
        const wsData = db.saas_state.workshopData;
        if (wsData.dte_config) {
            localStorage.setItem('mecanic_os_dte_config', JSON.stringify(wsData.dte_config));
        }
        if (wsData.firebase_config) {
            localStorage.setItem('mecanic_os_firebase_config', JSON.stringify(wsData.firebase_config));
        } else if (db.saas_state.status === 'guest') {
            localStorage.removeItem('mecanic_os_firebase_config');
        }
    }
    if (isFirebaseConnected && currentFirebaseUser && !preventFirestoreSync) {
        syncToFirestore(db);
    }
}

// ----------------------------------------------------
// GOOGLE FIREBASE REAL-TIME SYNC ENGINE
// ----------------------------------------------------

let isFirebaseConnected = false;
let dbFirestore = null;
let currentFirebaseUser = null;
let firebaseUnsubscribe = null;
let preventFirestoreSync = false;
let lastSyncTime = null;

// Default Firebase Configuration (Centralized SaaS)
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyC_FakeMecanicOSKey1234567890",
    authDomain: "mecanic-os-saas.firebaseapp.com",
    projectId: "mecanic-os-saas",
    storageBucket: "mecanic-os-saas.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcd1234efgh5678"
};

function getFirebaseConfig() {
    let customCfg = null;
    try {
        customCfg = JSON.parse(localStorage.getItem('mecanic_os_firebase_config'));
    } catch (e) {}
    return customCfg || DEFAULT_FIREBASE_CONFIG;
}

function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn("Firebase SDK no cargado (offline o sin script). Iniciando en modo offline.");
        updateCloudStatusUI(false, "offline");
        return;
    }

    const config = getFirebaseConfig();
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(config);
        }
        dbFirestore = firebase.firestore();
        isFirebaseConnected = true;
        
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                currentFirebaseUser = user;
                updateCloudStatusUI(true, "active");
                startRealTimeSync(user.uid);
            } else {
                currentFirebaseUser = null;
                updateCloudStatusUI(false, "logged-out");
                stopRealTimeSync();
            }
        });
    } catch (err) {
        console.error("Error al conectar con Firebase:", err);
        isFirebaseConnected = false;
        updateCloudStatusUI(false, "error");
    }
}

function updateCloudStatusUI(active, state = "") {
    const dot = document.getElementById('cloud-sync-dot');
    const label = document.getElementById('cloud-sync-label');
    
    if (!dot || !label) return;
    
    if (active && state === "active") {
        dot.style.backgroundColor = "#2ecc71"; // Green
        label.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Conectado`;
        
        const loggedOutView = document.getElementById('fb-logged-out-view');
        const loggedInView = document.getElementById('fb-logged-in-view');
        const userEmailSpan = document.getElementById('fb-user-email');
        const lastSyncSpan = document.getElementById('fb-last-sync');
        
        if (loggedOutView) loggedOutView.style.display = "none";
        if (loggedInView) loggedInView.style.display = "block";
        if (userEmailSpan && currentFirebaseUser) userEmailSpan.textContent = currentFirebaseUser.email;
        if (lastSyncSpan) lastSyncSpan.textContent = lastSyncTime ? lastSyncTime.toLocaleTimeString() : "Nunca";
    } else if (state === "syncing") {
        dot.style.backgroundColor = "#f1c40f"; // Yellow
        label.innerHTML = `<i class="fa-solid fa-sync fa-spin"></i> Sincronizando...`;
    } else if (state === "offline" || state === "logged-out") {
        dot.style.backgroundColor = "#7f8c8d"; // Grey
        label.innerHTML = `<i class="fa-solid fa-cloud"></i> Sin cuenta en nube`;
        
        const loggedOutView = document.getElementById('fb-logged-out-view');
        const loggedInView = document.getElementById('fb-logged-in-view');
        if (loggedOutView) loggedOutView.style.display = "block";
        if (loggedInView) loggedInView.style.display = "none";
    } else {
        dot.style.backgroundColor = "#e74c3c"; // Red
        label.innerHTML = `<i class="fa-solid fa-cloud"></i> Error Conexión`;
    }
}

function startRealTimeSync(userId) {
    if (!dbFirestore) return;
    
    stopRealTimeSync();
    
    updateCloudStatusUI(true, "syncing");
    
    firebaseUnsubscribe = dbFirestore.collection("workshops").doc(userId).onSnapshot((doc) => {
        if (doc.exists) {
            const remoteData = doc.data();
            const remoteDb = remoteData.database;
            
            if (remoteDb) {
                const remoteDbStr = JSON.stringify(remoteDb);
                const localDbStr = localStorage.getItem('mecanic_os_db');
                
                if (remoteDbStr !== localDbStr) {
                    console.log("Firebase Sync: Actualizando base de datos local con cambios remotos.");
                    
                    preventFirestoreSync = true;
                    localStorage.setItem('mecanic_os_db', remoteDbStr);
                    
                    // Reload active view
                    const activeRoute = window.location.hash.substring(1) || 'taller-dashboard';
                    handleRouting();
                    
                    showToast("Base de datos sincronizada en tiempo real", "success");
                    
                    setTimeout(() => {
                        preventFirestoreSync = false;
                    }, 500);
                }
                
                if (remoteData.updatedAt) {
                    lastSyncTime = new Date(remoteData.updatedAt);
                }
            }
        } else {
            console.log("Firebase Sync: No hay datos remotos aún. Sincronizando datos locales actuales a la nube.");
            const currentDb = getDatabase();
            if (currentDb) {
                uploadLocalDatabase();
            }
        }
        updateCloudStatusUI(true, "active");
    }, (err) => {
        console.error("Error en Snapshot de Firestore:", err);
        updateCloudStatusUI(false, "error");
    });
}

function stopRealTimeSync() {
    if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
        firebaseUnsubscribe = null;
    }
}

function syncToFirestore(db) {
    if (!dbFirestore || !currentFirebaseUser || preventFirestoreSync) return;
    
    const userId = currentFirebaseUser.uid;
    updateCloudStatusUI(true, "syncing");
    
    dbFirestore.collection("workshops").doc(userId).set({
        database: db,
        updatedAt: new Date().toISOString(),
        updatedBy: currentFirebaseUser.email
    }).then(() => {
        lastSyncTime = new Date();
        updateCloudStatusUI(true, "active");
        console.log("Firebase Sync: Base de datos subida exitosamente.");
    }).catch((err) => {
        console.error("Error al subir cambios a Firebase:", err);
        updateCloudStatusUI(false, "error");
    });
}

function uploadLocalDatabase() {
    const db = getDatabase();
    if (db) {
        syncToFirestore(db);
        showToast("Datos locales subidos a la nube", "success");
    }
}

function downloadCloudDatabase() {
    if (!dbFirestore || !currentFirebaseUser) return;
    
    const userId = currentFirebaseUser.uid;
    updateCloudStatusUI(true, "syncing");
    
    dbFirestore.collection("workshops").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const remoteData = doc.data();
            const remoteDb = remoteData.database;
            if (remoteDb) {
                localStorage.setItem('mecanic_os_db', JSON.stringify(remoteDb));
                lastSyncTime = new Date(remoteData.updatedAt || new Date());
                handleRouting();
                showToast("Datos descargados desde la nube con éxito", "success");
            }
        } else {
            showToast("No se encontraron datos remotos para descargar", "warning");
        }
        updateCloudStatusUI(true, "active");
    }).catch(err => {
        console.error("Error al descargar base de datos de Firebase:", err);
        showToast("Error al descargar de la nube", "error");
        updateCloudStatusUI(true, "active");
    });
}

function bindFirebaseEvents() {
    const cloudIndicator = document.getElementById('cloud-sync-indicator');
    const authModal = document.getElementById('firebase-auth-modal');
    const closeBtn = document.getElementById('close-firebase-modal');
    const showRegister = document.getElementById('fb-show-register');
    const showLogin = document.getElementById('fb-show-login');
    const loginForm = document.getElementById('fb-login-form');
    const registerForm = document.getElementById('fb-register-form');
    const logoutBtn = document.getElementById('fb-btn-logout');
    const forceSyncBtn = document.getElementById('fb-btn-force-sync');
    const uploadLocalBtn = document.getElementById('fb-btn-upload-local');
    const downloadCloudBtn = document.getElementById('fb-btn-download-cloud');

    if (!authModal) return;

    if (cloudIndicator) {
        cloudIndicator.addEventListener('click', () => {
            authModal.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('fb-login-section').style.display = "none";
            document.getElementById('fb-register-section').style.display = "block";
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('fb-login-section').style.display = "block";
            document.getElementById('fb-register-section').style.display = "none";
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('fb-login-email').value;
            const pass = document.getElementById('fb-login-password').value;
            
            if (typeof firebase === 'undefined') return;
            
            const btn = document.getElementById('fb-btn-login');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Iniciando...';
            
            firebase.auth().signInWithEmailAndPassword(email, pass)
                .then((userCredential) => {
                    showToast("Sesión iniciada correctamente en la nube", "success");
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
                    authModal.classList.remove('active');
                })
                .catch((error) => {
                    console.error("Error al iniciar sesión:", error);
                    showToast(`Error: ${error.message}`, "error");
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
                });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('fb-register-name').value;
            const email = document.getElementById('fb-register-email').value;
            const pass = document.getElementById('fb-register-password').value;
            
            if (typeof firebase === 'undefined') return;
            
            const btn = document.getElementById('fb-btn-register');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando cuenta...';
            
            firebase.auth().createUserWithEmailAndPassword(email, pass)
                .then((userCredential) => {
                    showToast("Taller registrado y conectado exitosamente", "success");
                    
                    const db = getDatabase();
                    if (db) {
                        if (!db.config_taller) db.config_taller = {};
                        db.config_taller.nombre = name;
                        db.config_taller.correo = email;
                        saveDatabase(db);
                    }
                    
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Crear Cuenta y Taller';
                    authModal.classList.remove('active');
                })
                .catch((error) => {
                    console.error("Error al registrar:", error);
                    showToast(`Error: ${error.message}`, "error");
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Crear Cuenta y Taller';
                });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof firebase === 'undefined') return;
            
            if (confirm("¿Seguro que deseas cerrar la sesión? Los datos locales permanecerán en esta PC pero ya no se sincronizarán en tiempo real.")) {
                firebase.auth().signOut()
                    .then(() => {
                        showToast("Sesión cerrada correctamente", "success");
                        authModal.classList.remove('active');
                    })
                    .catch(err => {
                        console.error("Error al cerrar sesión:", err);
                    });
            }
        });
    }

    if (forceSyncBtn) {
        forceSyncBtn.addEventListener('click', () => {
            if (currentFirebaseUser) {
                downloadCloudDatabase();
            }
        });
    }

    if (uploadLocalBtn) {
        uploadLocalBtn.addEventListener('click', () => {
            if (confirm("⚠️ ¡Atención! Esto sobrescribirá la base de datos que está en la nube con la información que tienes en este navegador local. ¿Deseas proceder?")) {
                uploadLocalDatabase();
            }
        });
    }

    if (downloadCloudBtn) {
        downloadCloudBtn.addEventListener('click', () => {
            if (confirm("⚠️ ¡Atención! Esto descargará la información de la nube y sobrescribirá la base de datos de esta PC. Perderás cualquier cambio local no guardado en la nube. ¿Deseas proceder?")) {
                downloadCloudDatabase();
            }
        });
    }
}

function getWorkshopConfig(db) {
    if (!db.config_taller) {
        db.config_taller = {
            nombre: 'GRUPO GEMA, S.A. DE C.V.',
            giro: 'Servicio de Mantenimiento al Transporte Terrestre',
            direccion: 'Carr. Sonsonate, col. Cuyagualo #16, Colon, La Libertad',
            telefono: '7625-0906',
            correo: 'grupogem2024@outlook.com',
            nit: '0614-111111-101-1',
            nrc: '123456-7',
            logoText: 'GRUPO GEMA',
            logoTagline: 'Mantenimiento de Flotas y Vehículos'
        };
    }
    return db.config_taller;
}

// Helper: Calculate total for any budget in db
function getBudgetGrandTotal(budget, db) {
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

    const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budget['ID Presupuesto']);
    const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budget['ID Presupuesto']);

    const sumProd = products.reduce((sum, p) => sum + parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1), 0);
    const sumLab = labor.reduce((sum, l) => sum + parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1), 0);
    const subtotal = sumProd + sumLab;
    const taxRate = parseFloat(budget['% Impuesto'] || 0.13);
    const iva = subtotal * taxRate;

    let retVal = 0;
    let percVal = 0;
    const client = db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { AplicaRetencion: 0, AplicaPercepcion: 0 };
    if (client.AplicaRetencion > 0) {
        retVal = subtotal * parseFloat(client.AplicaRetencion);
    }
    if (client.AplicaPercepcion > 0) {
        percVal = subtotal * parseFloat(client.AplicaPercepcion);
    }

    return subtotal + iva + percVal - retVal;
}

// Helper: Calculate client unpaid credit balance
function getClientPendingBalance(clientCode, db) {
    // 1. Get all budgets for client that are CREDIT and not paid (Pagado? !== 'SI')
    const clientBudgets = db.presupuestos.filter(p => p.Codigo_Cliente === clientCode && p.Condicion === 'CREDITO' && p['Pagado?'] !== 'SI');
    
    // Sum their grand totals
    let totalUnpaidBudgets = 0;
    clientBudgets.forEach(b => {
        totalUnpaidBudgets += getBudgetGrandTotal(b, db);
    });
    
    // 2. Subtract all abonos received for this client
    const clientAbonos = (db['30 Abonos Creditos'] || []).filter(ab => ab.Codigo_Cliente === clientCode);
    const totalAbonos = clientAbonos.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
    
    return Math.max(0, totalUnpaidBudgets - totalAbonos);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getActiveUser() {
    return JSON.parse(sessionStorage.getItem('mecanic_os_active_user'));
}

function setActiveUser(user) {
    if (user) {
        sessionStorage.setItem('mecanic_os_active_user', JSON.stringify(user));
    } else {
        sessionStorage.removeItem('mecanic_os_active_user');
    }
    updateUserUI();
}

// Update User info in UI
function updateUserUI() {
    const user = getActiveUser();
    const avatarEl = document.getElementById('current-user-avatar');
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');
    
    if (user) {
        nameEl.textContent = user.Nombre_Completo || user.Nombre || "Usuario";
        const roleName = user.Nivel_Acceso || "Mecánico";
        roleEl.textContent = roleName;
        if (user.Foto_Perfil) {
            avatarEl.src = user.Foto_Perfil;
        } else {
            avatarEl.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
        }

        // --- FILTER SIDEBAR MENU BASED ON ROLE PERMISSIONS ---
        const db = getDatabase();
        let allowedRoutes = [];
        if (db && db.role_permissions && db.role_permissions[roleName]) {
            allowedRoutes = db.role_permissions[roleName];
        } else {
            // Sensible fallbacks
            if (roleName === "Administrador") {
                allowedRoutes = [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                    "facturador", "venta-rapida", "cuentas-cobrar", "inventario", "gastos", "planilla",
                    "dashboard-bi", "configuracion"
                ];
            } else if (roleName === "Recepcionista") {
                allowedRoutes = [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                    "venta-rapida", "cuentas-cobrar"
                ];
            } else {
                // Default to Técnico permissions
                allowedRoutes = ["taller-dashboard", "clientes-vehiculos", "revision-21", "kanban"];
            }
        }

        // Update display of each menu-item
        document.querySelectorAll('.menu-item').forEach(item => {
            const route = item.getAttribute('data-route');
            if (route) {
                if (allowedRoutes.includes(route)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            }
        });

        // Hide/show menu sections based on whether they contain any visible items
        let lastSectionEl = null;
        let sectionHasVisibleItem = false;
        
        const sidebarMenu = document.querySelector('.sidebar-menu');
        if (sidebarMenu) {
            Array.from(sidebarMenu.children).forEach(child => {
                if (child.classList.contains('menu-section')) {
                    if (lastSectionEl) {
                        lastSectionEl.style.display = sectionHasVisibleItem ? '' : 'none';
                    }
                    lastSectionEl = child;
                    sectionHasVisibleItem = false;
                } else if (child.classList.contains('menu-item')) {
                    if (child.style.display !== 'none') {
                        sectionHasVisibleItem = true;
                    }
                }
            });
            if (lastSectionEl) {
                lastSectionEl.style.display = sectionHasVisibleItem ? '' : 'none';
            }
        }
    }
}

function updateSidebarBrand() {
    const db = getDatabase();
    if (db) {
        const ws = getWorkshopConfig(db);
        const brandEl = (document && typeof document.querySelector === 'function') ? document.querySelector('.brand-tag') : null;
        if (brandEl) {
            brandEl.textContent = ws.logoText || 'MecanicOS';
        }
    }
}

// Live Clock
function startClock() {
    const clockEl = document.getElementById('live-clock');
    function updateClock() {
        const now = new Date();
        const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        clockEl.textContent = now.toLocaleDateString('es-SV', options);
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// Show Toast Alert
function showToast(message, type = 'primary') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// SPA Routing System
let activeConfigTab = 'taller';
const routes = {
    'taller-dashboard': renderTallerDashboard,
    'clientes-vehiculos': renderClientesVehiculos,
    'revision-21': renderRevision21,
    'presupuestos': renderPresupuestos,
    'kanban': renderKanban,
    'facturador': renderFacturador,
    'venta-rapida': renderVentaRapida,
    'cuentas-cobrar': renderCuentasCobrar,
    'inventario': renderInventario,
    'gastos': renderGastos,
    'dashboard-bi': renderDashboardBI,
    'configuracion': renderConfiguracion,
    'planilla': renderPlanilla,
    'landing': renderLanding,
    'registro': renderRegistroSaaS,
    'admin-solicitudes': renderAdminSolicitudes,
    'terminos': renderTerminosSaaS,
    'suspended': renderSuspendedSaaS,
    'lock-screen': renderLockScreen
};

function handleRouting() {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    
    // Check if the current active workshop has been suspended by the SaaS admin
    if (saas.status === 'active' && saas.workshopData && saas.workshopData.id) {
        const ws = db.solicitudes_registro.find(s => s.id === saas.workshopData.id);
        if (ws && ws.suscripcion_status === 'suspendido') {
            saas.status = 'suspended';
            db.saas_state.status = 'suspended';
            saveDatabase(db);
        }
    }
    
    let hash = window.location.hash.substring(1);
    if (!hash) {
        hash = 'landing';
    }
    
    // Handle parameterized routes (e.g. #presupuestos?id=XXX)
    let routeName = hash;
    let queryParams = {};
    if (hash.includes('?')) {
        const parts = hash.split('?');
        routeName = parts[0];
        const rawParams = parts[1].split('&');
        rawParams.forEach(param => {
            const pair = param.split('=');
            queryParams[pair[0]] = decodeURIComponent(pair[1]);
        });
    }
    
    // Rutas públicas y de onboarding (incluye la pantalla de bloqueo)
    const publicSaasRoutes = ['landing', 'registro', 'admin-solicitudes', 'terminos', 'suspended', 'lock-screen'];
    
    // Force Lock Screen if active workshop but no employee session, AND trying to access operational views
    if (saas.status === 'active' && !getActiveUser() && !publicSaasRoutes.includes(routeName)) {
        window.location.hash = 'lock-screen';
        return;
    }
    
    if (saas.status === 'guest') {
        if (!publicSaasRoutes.includes(routeName)) {
            window.location.hash = 'landing';
            return;
        }
    } else if (saas.status === 'pending') {
        if (routeName !== 'landing' && routeName !== 'admin-solicitudes' && routeName !== 'registro') {
            window.location.hash = 'landing';
            return;
        }
    } else if (saas.status === 'approved_terms_pending') {
        if (routeName !== 'terminos' && routeName !== 'admin-solicitudes') {
            window.location.hash = 'terminos';
            return;
        }
    } else if (saas.status === 'suspended') {
        if (routeName !== 'suspended' && routeName !== 'admin-solicitudes') {
            window.location.hash = 'suspended';
            return;
        }
    }
    
    // Check role permissions for application views
    const appViews = [
        'taller-dashboard', 'clientes-vehiculos', 'revision-21', 'presupuestos', 'kanban',
        'facturador', 'venta-rapida', 'cuentas-cobrar', 'inventario', 'gastos', 'planilla',
        'dashboard-bi', 'configuracion'
    ];
    if (appViews.includes(routeName)) {
        const activeUser = getActiveUser();
        if (activeUser) {
            const roleName = activeUser.Nivel_Acceso || "Mecánico";
            let allowedRoutes = [];
            if (db && db.role_permissions && db.role_permissions[roleName]) {
                allowedRoutes = db.role_permissions[roleName];
            } else {
                if (roleName === "Administrador") {
                    allowedRoutes = appViews;
                } else if (roleName === "Recepcionista") {
                    allowedRoutes = [
                        "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                        "venta-rapida", "cuentas-cobrar"
                    ];
                } else {
                    allowedRoutes = ["taller-dashboard", "clientes-vehiculos", "revision-21", "kanban"];
                }
            }

            if (!allowedRoutes.includes(routeName)) {
                showToast("Acceso restringido: No tienes permisos para ver esta sección.", "error");
                const fallback = allowedRoutes.find(r => appViews.includes(r)) || 'taller-dashboard';
                window.location.hash = fallback;
                return;
            }
        }
    }
    
    const isFullScreenRoute = ['landing', 'registro', 'terminos', 'admin-solicitudes', 'suspended', 'lock-screen'].includes(routeName);
    const sidebarEl = document.getElementById('app-sidebar');
    const headerEl = document.querySelector('.top-header');
    const appContainer = document.querySelector('.app-container');
    const overlayEl = document.getElementById('sidebar-overlay');
    
    if (isFullScreenRoute) {
        if (sidebarEl) sidebarEl.style.display = 'none';
        if (headerEl) headerEl.style.display = 'none';
        if (overlayEl) overlayEl.style.display = 'none';
        if (appContainer) appContainer.style.gridTemplateColumns = '1fr';
    } else {
        if (sidebarEl) sidebarEl.style.display = '';
        if (headerEl) headerEl.style.display = '';
        if (appContainer) appContainer.style.gridTemplateColumns = '';
    }
    
    const renderFn = routes[routeName];
    if (renderFn) {
        // Update active menu class
        document.querySelectorAll('.menu-item').forEach(item => {
            if (item.getAttribute('data-route') === routeName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Dynamic view titles
        const titles = {
            'taller-dashboard': { title: 'Panel de Control de Taller', subtitle: 'Operaciones diarias y accesos directos' },
            'clientes-vehiculos': { title: 'Directorio de Clientes y Vehículos', subtitle: 'Historiales clínicos y gestión de flota' },
            'revision-21': { title: 'Hoja de Inspección de 21 Puntos', subtitle: 'Recepción digital y diagnóstico semáforo' },
            'presupuestos': { title: 'Presupuestos y Cotizaciones', subtitle: 'Cálculo de costos y emisión de cotizaciones' },
            'kanban': { title: 'Tablero de Control del Taller', subtitle: 'Monitoreo de flujo y estado de reparaciones' },
            'facturador': { title: 'Facturador DTE (Ministerio de Hacienda)', subtitle: 'Validación fiscal y emisión de facturas electrónicas' },
            'venta-rapida': { title: 'Punto de Venta Rápida (POS)', subtitle: 'Despacho en mostrador de repuestos y servicios' },
            'cuentas-cobrar': { title: 'Créditos y Cuentas por Cobrar', subtitle: 'Abonos, estados de cuenta y saldos' },
            'inventario': { title: 'Control de Inventario y Kárdex', subtitle: 'Saldos de repuestos, mínimos y movimientos' },
            'gastos': { title: 'Compras y Gastos Operativos', subtitle: 'Registro de egresos y facturas de proveedores' },
            'dashboard-bi': { title: 'Módulo de Inteligencia de Negocios (BI)', subtitle: 'KPIs financieros y de productividad' },
            'configuracion': { title: 'Configuración y Ajustes Maestros', subtitle: 'Administración de catálogos e integración DTE' },
            'planilla': { title: 'Gestión de Planillas y Salarios', subtitle: 'Control de nómina, boletas de pago y deducciones de ley (El Salvador)' }
        };
        
        const info = titles[routeName] || { title: 'Mecanic OS', subtitle: 'Gestión Inteligente' };
        document.getElementById('view-title').textContent = info.title;
        document.getElementById('view-subtitle').textContent = info.subtitle;
        
        const container = document.getElementById('view-container');
        container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando vista...</div>';
        
        setTimeout(() => {
            try {
                renderFn(container, queryParams);
            } catch (err) {
                console.error("Error rendering view:", err);
                container.innerHTML = `<div class="glass-card" style="border-color: var(--danger); text-align: center; padding: 3rem;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                    <h2>Error al cargar la vista</h2>
                    <p style="color: var(--text-secondary); margin: 1rem 0;">${err.message}</p>
                    <button class="btn btn-secondary" onclick="window.location.hash = '#taller-dashboard'">Volver al Panel</button>
                </div>`;
            }
        }, 100);
    } else {
        window.location.hash = 'taller-dashboard';
    }
}

// ----------------------------------------------------
// VIEW RENDERING FUNCTIONS
// ----------------------------------------------------

// 1. TALLER DASHBOARD VIEW
function renderTallerDashboard(container) {
    const db = getDatabase();
    
    // Calculate stats
    const activeVehicles = db.presupuestos.filter(p => p.Estado !== 3 && p.Estado !== '3').length; // non-invoiced
    const today = new Date().toDateString();
    
    // Mock data for dashboard
    const statsHTML = `
        <div class="dashboard-grid">
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Autos en Taller</span>
                    <span class="stat-value">${activeVehicles + 3}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +2 esta semana</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-car"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Presupuestos Aprobados</span>
                    <span class="stat-value">${db.presupuestos.filter(p => p.Estado === 2 || p.Estado === '2').length}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> Cotizados hoy</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-file-signature"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Facturado Hoy (DTE)</span>
                    <span class="stat-value">$1,845.20</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +12% vs ayer</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Alertas Stock Mínimo</span>
                    <span class="stat-value">5</span>
                    <span class="stat-trend down"><i class="fa-solid fa-arrow-trend-down"></i> Repuestos críticos</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            </div>
        </div>
        
        <h2>Accesos Rápidos</h2>
        <div class="quick-actions-panel">
            <div class="action-card" onclick="window.location.hash='#revision-21'">
                <i class="fa-solid fa-clipboard-list"></i>
                <h3>Nueva Recepción</h3>
                <p>Inspección 21 Puntos y registro de ingreso</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#presupuestos'">
                <i class="fa-solid fa-file-invoice-dollar"></i>
                <h3>Crear Presupuesto</h3>
                <p>Cotización de servicios y partes a clientes</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#kanban'">
                <i class="fa-solid fa-network-wired"></i>
                <h3>Tablero Kanban</h3>
                <p>Ver flujo del taller y técnicos asignados</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#venta-rapida'">
                <i class="fa-solid fa-cash-register"></i>
                <h3>Venta Rápida POS</h3>
                <p>Facturación directa en mostrador</p>
            </div>
        </div>
        
        <div class="view-split">
            <div class="glass-card">
                <h3>Vehículos Activos en Proceso</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Placas</th>
                                <th>Cliente</th>
                                <th>Técnico</th>
                                <th>Fallas Reportadas</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.presupuestos.slice(0, 5).map(p => {
                                const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === p.ID_Vehiculo) || { Placas: p.Placas || 'N/A' };
                                const tech = db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado) || { Nombre_Completo: 'Sin Asignar' };
                                let statusBadge = '';
                                if (p.Estado == 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
                                else if (p.Estado == 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
                                else if (p.Estado == 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
                                else statusBadge = '<span class="badge-tag badge-success">En Espera</span>';
                                
                                return `
                                    <tr>
                                        <td><strong>${vehicle.Placas}</strong></td>
                                        <td>${p.Nombre}</td>
                                        <td>${tech.Nombre_Completo}</td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.Fallas_Detectadas || 'Mantenimiento General'}</td>
                                        <td>${statusBadge}</td>
                                        <td><a href="#presupuestos?id=${p['ID Presupuesto']}" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-eye"></i> Ver</a></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h3>Distribución de Carga en Taller</h3>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 1.5rem;">Carga por técnico asignado</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${db.tecnicos.map(t => {
                            const count = db.presupuestos.filter(p => p.Tecnico_Asignado === t.Tecnico_ID && p.Estado !== 3).length;
                            const percentage = Math.min((count / 5) * 100, 100);
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                        <span>${t.Nombre_Completo}</span>
                                        <strong>${count} autos</strong>
                                    </div>
                                    <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                                        <div style="background: linear-gradient(to right, var(--primary), var(--cyan)); width: ${percentage}%; height: 100%;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1.5rem; text-align: center;">
                    <button class="btn btn-primary" onclick="window.location.hash='#kanban'" style="width: 100%;"><i class="fa-solid fa-magnifying-glass-chart"></i> Ir al Monitoreo en Tiempo Real</button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = statsHTML;
}

// 2. CLIENTES Y VEHICULOS VIEW
function renderClientesVehiculos(container, queryParams) {
    const db = getDatabase();
    
    // Render framework
    container.innerHTML = `
        <div class="master-detail-container">
            <div class="glass-card list-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                    <div class="search-bar-container" style="max-width: 100%;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="client-search" placeholder="Buscar cliente por nombre o doc...">
                    </div>
                    <button class="btn btn-primary" id="add-client-btn" style="padding: 0.6rem 1rem;"><i class="fa-solid fa-user-plus"></i></button>
                </div>
                
                <div class="scrollable-list" id="clients-list-container">
                    <!-- Loaded dynamically -->
                </div>
            </div>
            
            <div class="glass-card detail-panel" id="client-detail-container">
                <div style="text-align: center; padding: 4rem 1rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-id-card-user" style="font-size: 4rem; color: var(--border-color); margin-bottom: 1.5rem;"></i>
                    <h3>Selecciona un cliente de la lista</h3>
                    <p>Para ver su información fiscal, flota de vehículos e historial del taller.</p>
                </div>
            </div>
        </div>

        <!-- Add Client Modal -->
        <div id="add-client-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>Registrar Nuevo Cliente</h2>
                    <button class="close-modal-btn" id="close-add-client-modal">&times;</button>
                </div>
                <form id="add-client-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre Completo / Razón Social</label>
                            <input type="text" id="new-client-name" required placeholder="Nombre completo">
                        </div>
                        <div class="form-group">
                            <label>Tipo de Cliente</label>
                            <select id="new-client-type">
                                <option value="NATURAL">Persona Natural</option>
                                <option value="JURIDICA">Persona Jurídica (Empresa)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Contribuyente (IVA)?</label>
                            <select id="new-client-contrib">
                                <option value="NO">No (Sujeto Excluido/Final)</option>
                                <option value="SI">Sí (Emite Crédito Fiscal)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Documento</label>
                            <select id="new-client-doc-type">
                                <option value="DUI">DUI</option>
                                <option value="NIT">NIT</option>
                                <option value="PASAPORTE">Pasaporte</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nº de Documento</label>
                            <input type="text" id="new-client-doc-num" required placeholder="00000000-0">
                        </div>
                        <div class="form-group">
                            <label>NIT (si aplica)</label>
                            <input type="text" id="new-client-nit" placeholder="0000-000000-000-0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>NRC (Nº de Registro Contribuyente)</label>
                            <input type="text" id="new-client-nrc" placeholder="00000-0">
                        </div>
                        <div class="form-group">
                            <label>Giro Comercial (Actividad Económica)</label>
                            <input type="text" id="new-client-giro" placeholder="Servicios, Comercio, etc.">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Categoría Contribuyente (DTE El Salvador)</label>
                            <select id="new-client-cat">
                                <option value="OTROS">Otros Contribuyentes</option>
                                <option value="MEDIANO">Mediano Contribuyente</option>
                                <option value="GRANDE">Gran Contribuyente</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Línea de Crédito Autorizada?</label>
                            <select id="new-client-has-credit">
                                <option value="NO">No (Solo Contado)</option>
                                <option value="SI">Sí (Permite Crédito)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Retención IVA (1% - Compras Grandes)</label>
                            <select id="new-client-ret">
                                <option value="0">No aplica</option>
                                <option value="0.01">Aplica 1% Retención (Agente Gran Contribuyente)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Percepción IVA (2%)</label>
                            <select id="new-client-perc">
                                <option value="0">No aplica</option>
                                <option value="0.02">Aplica 2% Percepción</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row" id="credit-fields-row" style="display: none;">
                        <div class="form-group">
                            <label>Monto de Crédito ($)</label>
                            <input type="number" id="new-client-credit-limit" value="0" min="0" step="100">
                        </div>
                        <div class="form-group">
                            <label>Plazo de Crédito (Días)</label>
                            <input type="number" id="new-client-credit-days" value="30" min="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Correo Electrónico (Envío DTE)</label>
                            <input type="email" id="new-client-email" required placeholder="cliente@correo.com">
                        </div>
                        <div class="form-group">
                            <label>Teléfono 1</label>
                            <input type="text" id="new-client-phone" required placeholder="7000-0000">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dirección Completa</label>
                        <input type="text" id="new-client-address" required placeholder="Calle, pasaje, colonia, casa #">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-add-client">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Registrar Cliente</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Add Vehicle Modal -->
        <div id="add-vehicle-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Agregar Vehículo a Flota</h2>
                    <button class="close-modal-btn" id="close-add-vehicle-modal">&times;</button>
                </div>
                <form id="add-vehicle-form">
                    <input type="hidden" id="vehicle-client-code">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Número de Placas</label>
                            <input type="text" id="new-veh-placa" required placeholder="P 000000, C 00000">
                        </div>
                        <div class="form-group">
                            <label>Marca</label>
                            <input type="text" id="new-veh-marca" required placeholder="Toyota, Freightliner, Hino">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Modelo</label>
                            <input type="text" id="new-veh-modelo" required placeholder="Hilux, Cascadia, M3">
                        </div>
                        <div class="form-group">
                            <label>Año</label>
                            <input type="number" id="new-veh-year" required placeholder="2018">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Color</label>
                            <input type="text" id="new-veh-color" placeholder="Blanco, Gris, Rojo">
                        </div>
                        <div class="form-group">
                            <label>Odómetro (Kilometraje/Millas)</label>
                            <input type="text" id="new-veh-odo" placeholder="125,000 Km">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Número de Motor</label>
                            <input type="text" id="new-veh-motor" placeholder="Código de Motor">
                        </div>
                        <div class="form-group">
                            <label>Nº de Chasis / VIN</label>
                            <input type="text" id="new-veh-vin" placeholder="17 dígitos">
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-add-vehicle">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Registrar Vehículo</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    const clientsListContainer = document.getElementById('clients-list-container');
    const clientSearch = document.getElementById('client-search');
    const clientDetailContainer = document.getElementById('client-detail-container');
    
    // Function to render the client items
    function populateClientsList(filter = '') {
        clientsListContainer.innerHTML = '';
        const filtered = db.clientes.filter(c => 
            (c.Nombre || '').toLowerCase().includes(filter.toLowerCase()) ||
            (c.Codigo_Cliente || '').toLowerCase().includes(filter.toLowerCase()) ||
            (c.Num_Doc || '').toLowerCase().includes(filter.toLowerCase())
        );
        
        if (filtered.length === 0) {
            clientsListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Sin coincidencias</div>';
            return;
        }
        
        filtered.forEach(client => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.setAttribute('data-id', client.Codigo_Cliente);
            item.innerHTML = `
                <div class="list-item-main">
                    <span class="list-item-title">${client.Nombre}</span>
                    <span class="list-item-subtitle">${client.Codigo_Cliente} • Tel: ${client['Telefono 1 '] || client.Telefono || 'N/A'}</span>
                </div>
                <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.8rem;"></i>
            `;
            
            item.addEventListener('click', () => {
                document.querySelectorAll('.list-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                showClientDetail(client);
            });
            clientsListContainer.appendChild(item);
        });
    }
    
    // Function to show client detail
    function showClientDetail(client) {
        const clientVehicles = db.vehiculos.filter(v => v.Codigo_Cliente === client.Codigo_Cliente);
        const clientBudgets = db.presupuestos.filter(p => p.Codigo_Cliente === client.Codigo_Cliente);
        
        clientDetailContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                    <h2>${client.Nombre}</h2>
                    <span class="badge-tag badge-primary" style="margin-top: 0.5rem;">${client['Tipo Cliente'] || 'Persona Natural'}</span>
                    ${client['Contribuyente?'] === 'SI' ? '<span class="badge-tag badge-success">Contribuyente IVA</span>' : '<span class="badge-tag badge-warning">Consumidor Final</span>'}
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-secondary" id="add-vehicle-trigger-btn"><i class="fa-solid fa-car-side"></i> Agregar Auto</button>
                    <button class="btn btn-primary" id="start-ins-trigger-btn"><i class="fa-solid fa-clipboard-check"></i> Nueva Recepción</button>
                </div>
            </div>
            
            <div class="form-row">
                <div>
                    <h4 style="margin-bottom: 0.75rem; color: var(--text-secondary);">Datos Fiscales y Contacto</h4>
                    <table style="width: 100%; font-size: 0.85rem;">
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Código:</td><td><strong>${client.Codigo_Cliente}</strong></td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Doc ID (${client['Tipo Doc'] || 'DUI'}):</td><td>${client['Num Doc'] || 'N/A'}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">NIT/NRC:</td><td>${client.NIT || 'N/A'} / ${client.NRC || 'N/A'}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Giro:</td><td>${client.Giro || 'N/A'}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Correo:</td><td>${client.Correo || 'N/A'}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Dirección:</td><td>${client.Direccion || 'N/A'}</td></tr>
                    </table>
                </div>
                
                <div style="border-left: 1px solid var(--border-color); padding-left: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; color: var(--text-secondary);">Estado Financiero</h4>
                    <table style="width: 100%; font-size: 0.85rem;">
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Crédito Autorizado:</td><td><strong>${client['Credito?'] || 'NO'}</strong></td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Monto Crédito:</td><td>$ ${(parseFloat(client['Monto Credito'] || client.Monto_Credito || 0)).toFixed(2)}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Saldo Pendiente:</td><td style="color: var(--danger); font-weight: bold;">$ ${getClientPendingBalance(client.Codigo_Cliente, db).toFixed(2)}</td></tr>
                    </table>
                </div>
            </div>
            
            <h3 style="margin-top: 2rem;">Flota de Vehículos (${clientVehicles.length})</h3>
            <div class="vehicles-grid">
                ${clientVehicles.length === 0 
                    ? '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No se han registrado vehículos para este cliente.</div>' 
                    : clientVehicles.map(v => `
                        <div class="vehicle-card">
                            <i class="fa-solid fa-car-side vehicle-card-bg-icon"></i>
                            <div class="vehicle-placa">${v.Placas}</div>
                            <div class="vehicle-detail-row"><span>Marca/Modelo:</span><span><strong>${v.Marca} ${v.Modelo}</strong></span></div>
                            <div class="vehicle-detail-row"><span>Año/Color:</span><span>${v.Año || 'N/A'} • ${v.Color || 'N/A'}</span></div>
                            <div class="vehicle-detail-row"><span>Odómetro:</span><span>${v.Odometro || '0'}</span></div>
                            <div class="vehicle-detail-row"><span>VIN/Nº Motor:</span><span>${v.Nª_VIN || 'N/A'}</span></div>
                        </div>
                    `).join('')}
            </div>

            <h3 style="margin-top: 2rem;">Historial de Presupuestos e Inicios (${clientBudgets.length})</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID Presupuesto</th>
                            <th>Fecha</th>
                            <th>Placas</th>
                            <th>Trabajo Diagnóstico</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientBudgets.length === 0 
                            ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Sin presupuestos previos</td></tr>'
                            : clientBudgets.map(p => {
                                let statusBadge = '';
                                if (p.Estado == 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
                                else if (p.Estado == 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
                                else if (p.Estado == 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
                                return `
                                    <tr>
                                        <td><strong>${p['ID Presupuesto']}</strong></td>
                                        <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                                        <td>${p.Placas || 'N/A'}</td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.Fallas_Detectadas || p['Fallas Detectadas'] || 'Diagnóstico de taller'}</td>
                                        <td style="font-weight: 600;">$ ${getBudgetGrandTotal(p, db).toFixed(2)}</td>
                                        <td>${statusBadge}</td>
                                    </tr>
                                `;
                            }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Wire up triggers inside detail panel
        document.getElementById('add-vehicle-trigger-btn').addEventListener('click', () => {
            document.getElementById('vehicle-client-code').value = client.Codigo_Cliente;
            document.getElementById('add-vehicle-modal').classList.add('active');
        });
        
        document.getElementById('start-ins-trigger-btn').addEventListener('click', () => {
            window.location.hash = `#revision-21?client=${client.Codigo_Cliente}`;
        });
    }
    
    // Search filter listener
    clientSearch.addEventListener('input', (e) => {
        populateClientsList(e.target.value);
    });
    
    // Open/Close Add Client Modal
    document.getElementById('add-client-btn').addEventListener('click', () => {
        document.getElementById('add-client-modal').classList.add('active');
    });
    
    document.getElementById('close-add-client-modal').addEventListener('click', () => {
        document.getElementById('add-client-modal').classList.remove('active');
    });
    document.getElementById('cancel-add-client').addEventListener('click', () => {
        document.getElementById('add-client-modal').classList.remove('active');
    });
    
    // Open/Close Add Vehicle Modal
    document.getElementById('close-add-vehicle-modal').addEventListener('click', () => {
        document.getElementById('add-vehicle-modal').classList.remove('active');
    });
    document.getElementById('cancel-add-vehicle').addEventListener('click', () => {
        document.getElementById('add-vehicle-modal').classList.remove('active');
    });
    
    // Toggle credit limit/days input display based on credit setting
    if (document.getElementById('new-client-has-credit')) {
        document.getElementById('new-client-has-credit').addEventListener('change', (e) => {
            const row = document.getElementById('credit-fields-row');
            if (e.target.value === 'SI') {
                row.style.display = 'grid';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Handle Add Client Submit
    document.getElementById('add-client-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newCode = "CLIENT-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
        const name = document.getElementById('new-client-name').value;
        const type = document.getElementById('new-client-type').value;
        const contrib = document.getElementById('new-client-contrib').value;
        const docType = document.getElementById('new-client-doc-type').value;
        const docNum = document.getElementById('new-client-doc-num').value;
        const nit = document.getElementById('new-client-nit').value;
        const nrc = document.getElementById('new-client-nrc').value;
        const giro = document.getElementById('new-client-giro').value;
        const email = document.getElementById('new-client-email').value;
        const phone = document.getElementById('new-client-phone').value;
        const address = document.getElementById('new-client-address').value;
        
        // DTE & Credit settings
        const cat = document.getElementById('new-client-cat').value;
        const hasCredit = document.getElementById('new-client-has-credit').value;
        const ret = parseFloat(document.getElementById('new-client-ret').value || 0);
        const perc = parseFloat(document.getElementById('new-client-perc').value || 0);
        const creditLimit = parseFloat(document.getElementById('new-client-credit-limit').value || 0);
        const creditDays = parseInt(document.getElementById('new-client-credit-days').value || 30);
        
        const newClient = {
            Codigo_Cliente: newCode,
            Nombre: name.toUpperCase(),
            "Tipo Cliente": type,
            "Contribuyente?": contrib,
            "Tipo Doc": docType,
            "Num Doc": docNum,
            NIT: nit,
            NRC: nrc,
            Giro: giro,
            Correo: email,
            "Telefono 1 ": phone,
            Direccion: address,
            "Categoría Contribuyente": cat,
            "Credito?": hasCredit,
            AplicaRetencion: ret,
            AplicaPercepcion: perc,
            "Monto Credito": creditLimit,
            "Plazo Credito Días": creditDays,
            "% Impuesto": 0.13,
            Usuario: getActiveUser() ? getActiveUser().Tecnico_ID : ''
        };
        
        db.clientes.unshift(newClient);
        saveDatabase(db);
        showToast("Cliente registrado correctamente", "success");
        document.getElementById('add-client-modal').classList.remove('active');
        document.getElementById('add-client-form').reset();
        document.getElementById('credit-fields-row').style.display = 'none'; // hide credit inputs again
        populateClientsList();
    });
    
    // Handle Add Vehicle Submit
    document.getElementById('add-vehicle-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const clientCode = document.getElementById('vehicle-client-code').value;
        const client = db.clientes.find(c => c.Codigo_Cliente === clientCode);
        const newVehId = "VEHICULO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
        
        const placa = document.getElementById('new-veh-placa').value.toUpperCase();
        const marca = document.getElementById('new-veh-marca').value.toUpperCase();
        const modelo = document.getElementById('new-veh-modelo').value.toUpperCase();
        const year = document.getElementById('new-veh-year').value;
        const color = document.getElementById('new-veh-color').value.toUpperCase();
        const odo = document.getElementById('new-veh-odo').value;
        const motor = document.getElementById('new-veh-motor').value.toUpperCase();
        const vin = document.getElementById('new-veh-vin').value.toUpperCase();
        
        const newVehicle = {
            ID_Vehiculo: newVehId,
            Codigo_Cliente: clientCode,
            Nombre_Cliente: client.Nombre,
            Placas: placa,
            Marca: marca,
            Modelo: modelo,
            Año: year,
            Color: color,
            Odometro: odo,
            Nª_Motor: motor,
            Nª_VIN: vin
        };
        
        db.vehiculos.unshift(newVehicle);
        saveDatabase(db);
        showToast("Vehículo agregado a la flota", "success");
        document.getElementById('add-vehicle-modal').classList.remove('active');
        document.getElementById('add-vehicle-form').reset();
        showClientDetail(client);
    });

    // Run initial loaders
    populateClientsList();
    
    // Auto select client if parameter was passed
    if (queryParams.id) {
        const client = db.clientes.find(c => c.Codigo_Cliente === queryParams.id);
        if (client) {
            showClientDetail(client);
        }
    }
}

// 3. REVISION DE 21 PUNTOS VIEW
function renderRevision21(container, queryParams) {
    const db = getDatabase();
    
    // 21 Checkpoints catalog
    const checkpoints = [
        { key: 'Freno de Mano', title: 'Freno de Mano (Recorrido / Regular)' },
        { key: 'AC', title: 'A/C Ventilación y filtro de cabina' },
        { key: 'Parabrisas', title: 'Parabrisas y Aspersores de agua' },
        { key: 'Luces', title: 'Luces exteriores y pito (claxon)' },
        { key: 'Fajas', title: 'Fajas de motor (alternador/bomba)' },
        { key: 'Refrigerante', title: 'Nivel y estado de Refrigerante' },
        { key: 'Bateria', title: 'Alternador, Batería y bornes' },
        { key: 'FugasMotor', title: 'Fugas de aceite / Niveles en Motor' },
        { key: 'FugasCajaCorona', title: 'Fugas de aceite en Caja y Corona' },
        { key: 'LiquidoFreno', title: 'Líquido de Frenos (Nivel/Fugas)' },
        { key: 'Llantas', title: 'Llantas (Estado, presiones, rotación)' },
        { key: 'Amortiguadores', title: 'Fugas en Amortiguadores' },
        { key: 'Embrague', title: 'Pedal de Embrague y Freno (Juego libre)' },
        { key: 'CajaDiferenciales', title: 'Fugas de Aceite en Caja y Diferenciales' },
        { key: 'Escape', title: 'Tuberías de Combustible y Escape' },
        { key: 'Combustible', title: 'Filtro de Aire / Conexiones Combustible' },
        { key: 'Suspension', title: 'Verificación de Suspensión Del/Tras' },
        { key: 'Direccion', title: 'Juego libre de Dirección y terminales' },
        { key: 'Cojinetes', title: 'Cojinetes de Bufa y Grasa' },
        { key: 'Arranque', title: 'Desmontar Arranque / Alternador (Mantenimiento)' },
        { key: 'Inyectores', title: 'Calibración de Inyectores / Bomba Inyecc.' }
    ];

    let clientOptionsHTML = db.clientes.map(c => `<option value="${c.Codigo_Cliente}">${c.Nombre} (${c.Codigo_Cliente})</option>`).join('');
    
    container.innerHTML = `
        <div class="inspection-container glass-card">
            <h2>Hoja de Recepción Física y Diagnóstico 21 Puntos</h2>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">Registra el ingreso del vehículo y el semáforo de revisión inicial.</p>
            
            <form id="inspection-form">
                <div class="inspection-header-fields">
                    <div class="form-group">
                        <label>Cliente</label>
                        <select id="ins-client-select" required>
                            <option value="">-- Seleccionar Cliente --</option>
                            ${clientOptionsHTML}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Vehículo (Placas)</label>
                        <select id="ins-vehicle-select" required disabled>
                            <option value="">-- Selecciona un cliente primero --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Kilometraje / Odómetro</label>
                        <input type="text" id="ins-odo" required placeholder="Ej. 125,400 Km">
                    </div>
                </div>

                <div class="inspection-header-fields" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label>Fallas Reportadas por el Cliente / Motivo de Visita</label>
                        <textarea id="ins-fallas" rows="2" required placeholder="Escriba las fallas reportadas..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Otras Observaciones Generales</label>
                        <textarea id="ins-observaciones" rows="2" placeholder="Golpes en carrocería, accesorios faltantes, etc."></textarea>
                    </div>
                </div>

                <div class="checkpoint-list">
                    <div class="checkpoint-row" style="background-color: var(--border-color); border-radius: var(--radius-sm); font-weight: bold; border: none; padding: 0.75rem 1rem;">
                        <div>Punto de Inspección</div>
                        <div style="text-align: center;">Estado (Semáforo)</div>
                        <div>Observaciones Técnicas Específicas</div>
                    </div>
                    
                    ${checkpoints.map((cp, idx) => `
                        <div class="checkpoint-row" data-key="${cp.key}">
                            <div class="checkpoint-info">
                                <span class="checkpoint-title">${idx + 1}. ${cp.title}</span>
                            </div>
                            <div class="checkpoint-selector">
                                <button type="button" class="checkpoint-btn btn-good active" data-value="BUENO">OK</button>
                                <button type="button" class="checkpoint-btn btn-warning" data-value="REVISAR">REP</button>
                                <button type="button" class="checkpoint-btn btn-bad" data-value="CRITICO">MAL</button>
                            </div>
                            <div>
                                <input type="text" class="checkpoint-obs" placeholder="Detalles de falla si aplica..." style="padding: 0.5rem; font-size: 0.85rem;">
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="window.location.hash='#taller-dashboard'">Cancelar</button>
                    <button type="submit" class="btn btn-success"><i class="fa-solid fa-save"></i> Guardar Inspección e Ingreso</button>
                </div>
            </form>
        </div>
    `;

    const clientSelect = document.getElementById('ins-client-select');
    const vehicleSelect = document.getElementById('ins-vehicle-select');
    const odoInput = document.getElementById('ins-odo');
    const form = document.getElementById('inspection-form');

    // Auto-select client from query params
    if (queryParams.client) {
        clientSelect.value = queryParams.client;
        updateVehicleDropdown(queryParams.client);
    }

    clientSelect.addEventListener('change', (e) => {
        updateVehicleDropdown(e.target.value);
    });

    function updateVehicleDropdown(clientCode) {
        vehicleSelect.innerHTML = '';
        if (!clientCode) {
            vehicleSelect.innerHTML = '<option value="">-- Selecciona un cliente primero --</option>';
            vehicleSelect.disabled = true;
            return;
        }

        const vehicles = db.vehiculos.filter(v => v.Codigo_Cliente === clientCode);
        if (vehicles.length === 0) {
            vehicleSelect.innerHTML = '<option value="">-- Sin vehículos registrados --</option>';
            vehicleSelect.disabled = true;
            return;
        }

        vehicleSelect.disabled = false;
        vehicles.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.ID_Vehiculo;
            opt.textContent = `${v.Placas} - ${v.Marca} ${v.Modelo} (${v.Año})`;
            vehicleSelect.appendChild(opt);
        });

        // Autofill current odometer if available
        if (vehicles[0] && vehicles[0].Odometro) {
            odoInput.value = vehicles[0].Odometro;
        }
    }

    // Toggle button active states in checkpoint semaphores
    document.querySelectorAll('.checkpoint-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.parentElement;
            parent.querySelectorAll('.checkpoint-btn').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Handle form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientCode = clientSelect.value;
        const vehId = vehicleSelect.value;
        const odo = odoInput.value;
        const fallas = document.getElementById('ins-fallas').value;
        const obsG = document.getElementById('ins-observaciones').value;
        
        const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === vehId);
        const client = db.clientes.find(c => c.Codigo_Cliente === clientCode);
        const revId = "REV21-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
        
        // Assemble checkpoint valuations
        const details = {};
        document.querySelectorAll('.checkpoint-row[data-key]').forEach(row => {
            const key = row.getAttribute('data-key');
            const state = row.querySelector('.checkpoint-btn.active').getAttribute('data-value');
            const obs = row.querySelector('.checkpoint-obs').value;
            details[key] = { estado: state, obs: obs };
        });

        const newRevision = {
            ID_Revision: revId,
            "Estado Revision": "Terminada",
            Fecha: new Date().toISOString().split('T')[0],
            Codigo_Cliente: clientCode,
            Correo: client.Correo,
            "Telefono 1 ": client['Telefono 1 '],
            ID_Vehiculo: vehId,
            Placas: vehicle.Placas,
            Marca: vehicle.Marca,
            Modelo: vehicle.Modelo,
            Año: vehicle.Año,
            Odometro: odo,
            Fallas_Reportadas: fallas,
            Observaciones_Generales: obsG,
            Chequeos: details
        };

        db.revisiones.unshift(newRevision);
        
        // Propose generating a budget immediately based on this revision
        const presId = "PRES-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
        const newBudget = {
            "ID Presupuesto": presId,
            Fecha: Date.now(),
            Codigo_Cliente: clientCode,
            Nombre: client.Nombre,
            "Telefono 1 ": client['Telefono 1 '] || '',
            Direccion: client.Direccion || '',
            "Categoría Contribuyente": client['Categoría Contribuyente'] || 'OTROS',
            ID_Vehiculo: vehId,
            Placas: vehicle.Placas,
            Kilometraje: odo,
            Estado: 1, // Iniciado / Diagnostico
            "% Impuesto": client['% Impuesto'] || 0.13,
            AplicaPercepcion: client.AplicaPercepcion || 0,
            AplicaRetencion: client.AplicaRetencion || 0,
            "Revision 21 puntos": revId,
            "Tecnico Asignado": db.tecnicos[0] ? db.tecnicos[0].Tecnico_ID : '',
            Fallas_Detectadas: fallas,
            "Pagado?": "NO"
        };

        db.presupuestos.unshift(newBudget);
        saveDatabase(db);
        
        showToast("Revisión guardada y cotización creada correctamente", "success");
        window.location.hash = `#presupuestos?id=${presId}`;
    });
}// 4. PRESUPUESTOS (COTIZADOR) VIEW
function renderPresupuestos(container, queryParams) {
    const db = getDatabase();
    
    // If action=new, load editor in creation mode
    if (queryParams.action === 'new') {
        renderBudgetEditor(container, null);
        return;
    }
    
    // If we have an ID, load that budget editor in edit mode
    if (queryParams.id) {
        const budget = db.presupuestos.find(p => p['ID Presupuesto'] === queryParams.id);
        if (!budget) {
            container.innerHTML = `<div class="glass-card" style="text-align: center; padding: 2rem;"><h2>Presupuesto no encontrado</h2></div>`;
            return;
        }
        renderBudgetEditor(container, budget);
        return;
    }

    // Otherwise, show list of budgets
    container.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div class="search-bar-container" style="max-width: 320px;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="budget-search" placeholder="Buscar por número o cliente...">
                </div>
                <button class="btn btn-primary" id="new-budget-direct-btn"><i class="fa-solid fa-file-circle-plus"></i> Nueva Cotización</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Código Presupuesto</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Placas Auto</th>
                            <th>Fallas / Diagnóstico</th>
                            <th>Estado</th>
                            <th>DTE Relacionado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="budgets-list-rows">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const rowsContainer = document.getElementById('budgets-list-rows');
    const searchInput = document.getElementById('budget-search');

    function populateBudgetsList(filter = '') {
        rowsContainer.innerHTML = '';
        const filtered = db.presupuestos.filter(p => 
            (p['ID Presupuesto'] || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p.Nombre || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p.Placas || '').toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Sin resultados</td></tr>';
            return;
        }

        filtered.forEach(p => {
            let statusBadge = '';
            if (p.Estado == 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
            else if (p.Estado == 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
            else if (p.Estado == 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
            else statusBadge = '<span class="badge-tag badge-success">En Espera</span>';
            
            const isFacturado = p.Estado == 3;
            const actionText = isFacturado ? '<i class="fa-solid fa-eye"></i> Ver' : '<i class="fa-solid fa-edit"></i> Editar';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p['ID Presupuesto']}</strong></td>
                <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                <td>${p.Nombre}</td>
                <td><span class="badge-tag badge-primary">${p.Placas || 'N/A'}</span></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.Fallas_Detectadas || 'Diagnóstico de taller'}</td>
                <td>${statusBadge}</td>
                <td><small>${p.controlNumber || 'Sin Emitir (Pendiente)'}</small></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="#presupuestos?id=${p['ID Presupuesto']}" class="btn btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;">${actionText}</a>
                        <button class="btn btn-secondary btn-print-budget-pdf" data-id="${p['ID Presupuesto']}" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                    </div>
                </td>
            `;
            rowsContainer.appendChild(tr);
        });

        // Bind print PDF buttons
        rowsContainer.querySelectorAll('.btn-print-budget-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                exportBudgetPDF(id);
            });
        });
    }

    searchInput.addEventListener('input', (e) => {
        populateBudgetsList(e.target.value);
    });

    document.getElementById('new-budget-direct-btn').addEventListener('click', () => {
        window.location.hash = '#presupuestos?action=new';
    });

    populateBudgetsList();
}

// BUDGET EDITOR SUB-VIEW
function renderBudgetEditor(container, budget) {
    const db = getDatabase();
    const isNew = (budget === null);
    const activeUser = getActiveUser();
    const isAdmin = activeUser && (activeUser.Nivel_Acceso === 'Administrador');
    
    if (isNew) {
        budget = {
            "ID Presupuesto": "PRES-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
            Fecha: Date.now(),
            Codigo_Cliente: '',
            Nombre: '',
            ID_Vehiculo: '',
            Placas: '',
            Kilometraje: '',
            Estado: 1, // Iniciado
            "% Impuesto": 0.13,
            AplicaPercepcion: 0,
            AplicaRetencion: 0,
            Tecnico_Asignado: db.tecnicos[0] ? db.tecnicos[0].Tecnico_ID : '',
            Fallas_Detectadas: '',
            "Pagado?": "NO"
        };
    }
    
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];
    
    let budgetProducts = isNew ? [] : db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budget['ID Presupuesto']);
    let budgetLabor = isNew ? [] : db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budget['ID Presupuesto']);
    
    const client = isNew ? null : (db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { Nombre: budget.Nombre });
    const vehicle = isNew ? null : (db.vehiculos.find(v => v.ID_Vehiculo === budget.ID_Vehiculo) || { Placas: budget.Placas || 'N/A', Marca: 'N/A', Modelo: 'N/A' });
    const techsHTML = db.tecnicos.map(t => `<option value="${t.Tecnico_ID}" ${budget.Tecnico_Asignado === t.Tecnico_ID ? 'selected' : ''}>${t.Nombre_Completo}</option>`).join('');

    // Generate header HTML
    let headerHTML = '';
    if (isNew) {
        headerHTML = `
            <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 1.25rem; color: var(--primary); font-family: var(--font-heading); display:flex; align-items:center; gap:0.5rem;"><i class="fa-solid fa-file-invoice-dollar"></i> Crear Nueva Cotización</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>1. Seleccionar Cliente</label>
                        <select id="editor-client-select" required style="padding: 0.65rem;">
                            <option value="">-- Busque y seleccione Cliente --</option>
                            ${db.clientes.map(c => `<option value="${c.Codigo_Cliente}">${c.Nombre} (${c.Codigo_Cliente})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>2. Seleccionar Vehículo</label>
                        <select id="editor-vehicle-select" required disabled style="padding: 0.65rem;">
                            <option value="">-- Elija vehículo (seleccione cliente primero) --</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Kilometraje / Odómetro</label>
                        <input type="text" id="editor-odo" placeholder="Ej. 120,000 Km" style="padding: 0.6rem;">
                    </div>
                    <div class="form-group">
                        <label>Técnico Asignado</label>
                        <select id="editor-tech-select" style="padding: 0.6rem;">
                            ${techsHTML}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Fallas Detectadas / Diagnóstico Final</label>
                    <input type="text" id="editor-fallas" placeholder="Escriba fallas reportadas o diagnóstico inicial..." style="padding: 0.65rem;">
                </div>
            </div>
        `;
    } else {
        headerHTML = `
            <div class="glass-card" style="padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <span class="badge-tag badge-primary" style="font-family: var(--font-heading); font-size: 1rem;">${budget['ID Presupuesto']}</span>
                        <h2 style="margin-top: 0.5rem;">${client.Nombre}</h2>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">Vehículo: <strong>${vehicle.Placas} (${vehicle.Marca} ${vehicle.Modelo})</strong> • Odómetro: ${budget.Kilometraje || '0'}</p>
                    </div>
                    <div class="form-group" style="width: 200px;">
                        <label>Técnico Asignado</label>
                        <select id="editor-tech-select" style="padding: 0.5rem;" ${budget.Estado == 3 ? 'disabled' : ''}>
                            ${techsHTML}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Fallas Detectadas / Diagnóstico Final</label>
                    <input type="text" id="editor-fallas" value="${budget.Fallas_Detectadas || 'Diagnóstico general'}" style="padding: 0.6rem;" ${budget.Estado == 3 ? 'disabled' : ''}>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="budget-editor" id="budget-editor-layout">
            <div class="items-section">
                <!-- Header Info Card -->
                ${headerHTML}

                <!-- Products (Spare Parts) Detail -->
                <div class="glass-card" id="editor-products-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Repuestos y Refacciones</h3>
                        <button class="btn btn-primary" id="add-prod-item-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" ${isNew || budget.Estado == 3 ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Agregar Repuesto</button>
                    </div>
                    
                    <div class="item-row" style="background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;">
                        <div>Código</div>
                        <div>Descripción</div>
                        <div>Cantidad</div>
                        <div>Precio Unit.</div>
                        <div style="text-align: right;">Total</div>
                        <div></div>
                    </div>
                    
                    <div id="budget-products-rows" style="margin-top: 0.5rem;">
                        <!-- Injected -->
                    </div>
                </div>

                <!-- Labor Detail -->
                <div class="glass-card" id="editor-labor-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Mano de Obra y Servicios</h3>
                        <button class="btn btn-primary" id="add-labor-item-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" ${isNew || budget.Estado == 3 ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Agregar Servicio</button>
                    </div>
                    
                    <div class="item-row" style="background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;">
                        <div>Código</div>
                        <div>Descripción del Servicio</div>
                        <div>Cantidad</div>
                        <div>Precio Unit.</div>
                        <div style="text-align: right;">Total</div>
                        <div></div>
                    </div>
                    
                    <div id="budget-labor-rows" style="margin-top: 0.5rem;">
                        <!-- Injected -->
                    </div>
                </div>
            </div>

            <!-- Summary Sticky Sidebar -->
            <div class="summary-sidebar glass-card" id="editor-summary-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                <h3>Resumen Presupuesto</h3>
                <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 1.5rem;">Condiciones fiscales aplicadas</p>
                
                <div class="form-group">
                    <label>Estado del Presupuesto</label>
                    <select id="editor-state" style="padding: 0.5rem; font-weight: 600;" ${budget.Estado == 3 ? 'disabled' : ''}>
                        <option value="1" ${budget.Estado == 1 ? 'selected' : ''}>1 - Creado</option>
                        <option value="2" ${budget.Estado == 2 ? 'selected' : ''} ${!isAdmin ? 'disabled' : ''}>2 - Aprobado ${!isAdmin ? '(Solo Admin)' : ''}</option>
                        <option value="3" ${budget.Estado == 3 ? 'selected' : ''} disabled>3 - Facturado</option>
                    </select>
                </div>
                
                <div style="border-top: 1px solid var(--border-color); margin-top: 1rem; padding-top: 1rem;">
                    <div class="summary-row"><span>Suma Repuestos:</span><span id="sum-products">$0.00</span></div>
                    <div class="summary-row"><span>Suma Mano Obra:</span><span id="sum-labor">$0.00</span></div>
                    <div class="summary-row"><span>Subtotal Neto:</span><span id="subtotal-neto" style="font-weight: 600;">$0.00</span></div>
                    <div class="summary-row"><span>IVA (13%):</span><span id="tax-iva">$0.00</span></div>
                    
                    <div id="ret-per-section">
                        <!-- Shows retention/perception if applicable -->
                    </div>
                    
                    <div class="summary-total">Total: <span id="grand-total">$0.00</span></div>
                </div>

                ${budget.Estado == 3 ? `
                <div style="background: rgba(46, 204, 113, 0.1); border: 1px solid var(--success); padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; color: var(--success); display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>Presupuesto facturado (Lectura).</span>
                </div>
                ` : ''}

                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
                    <button class="btn btn-primary" id="save-budget-btn" ${budget.Estado == 3 ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}><i class="fa-solid fa-floppy-disk"></i> Guardar Cotización</button>
                    ${(!isNew && budget.Estado == 2) ? `<button class="btn btn-success" id="facturar-budget-shortcut-btn"><i class="fa-solid fa-wallet"></i> Facturar DTE</button>` : ''}
                    ${!isNew ? `<button class="btn btn-secondary" id="print-budget-btn" type="button"><i class="fa-solid fa-file-pdf"></i> Compartir / PDF</button>` : ''}
                    <button class="btn btn-secondary" onclick="window.location.hash='#presupuestos'"><i class="fa-solid fa-arrow-left"></i> Volver a Lista</button>
                </div>
            </div>
        </div>

        <!-- Add Product Item Modal -->
        <div id="item-prod-modal" class="modal">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2>Buscar Repuesto</h2>
                    <button class="close-modal-btn" id="close-item-prod-modal">&times;</button>
                </div>
                <div class="form-group">
                    <label>Buscar en catálogo</label>
                    <input type="text" id="search-catalogo-prod" placeholder="Escribe descripción o código...">
                </div>
                <div class="scrollable-list" id="catalogo-prod-results" style="max-height: 300px;">
                    <!-- Results dynamic -->
                </div>
            </div>
        </div>

        <!-- Add Labor Item Modal -->
        <div id="item-labor-modal" class="modal">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2>Buscar Servicio (Mano de Obra)</h2>
                    <button class="close-modal-btn" id="close-item-labor-modal">&times;</button>
                </div>
                <div class="form-group">
                    <label>Buscar en catálogo</label>
                    <input type="text" id="search-catalogo-labor" placeholder="Escribe descripción de servicio...">
                </div>
                <div class="scrollable-list" id="catalogo-labor-results" style="max-height: 300px;">
                    <!-- Results dynamic -->
                </div>
            </div>
        </div>
    `;

    const productsContainer = document.getElementById('budget-products-rows');
    const laborContainer = document.getElementById('budget-labor-rows');

    // Load actual catalog products & labor for modals
    const prodModal = document.getElementById('item-prod-modal');
    const laborModal = document.getElementById('item-labor-modal');
    const searchProdInput = document.getElementById('search-catalogo-prod');
    const searchLaborInput = document.getElementById('search-catalogo-labor');
    const prodResults = document.getElementById('catalogo-prod-results');
    const laborResults = document.getElementById('catalogo-labor-results');

    // Local temporary copies of products/labor rows so we don't save to db until user clicks save
    let tempProducts = [...budgetProducts];
    let tempLabor = [...budgetLabor];

    // Helper functions for Creation Mode dropdowns
    if (isNew) {
        const clientSelect = document.getElementById('editor-client-select');
        const vehicleSelect = document.getElementById('editor-vehicle-select');
        
        clientSelect.addEventListener('change', (e) => {
            const clientCode = e.target.value;
            if (!clientCode) {
                vehicleSelect.innerHTML = '<option value="">-- Elija vehículo (seleccione cliente primero) --</option>';
                vehicleSelect.disabled = true;
                disableEditorModules();
                return;
            }
            
            const selectedClient = db.clientes.find(c => c.Codigo_Cliente === clientCode);
            budget.Codigo_Cliente = clientCode;
            budget.Nombre = selectedClient.Nombre;
            budget['% Impuesto'] = selectedClient['% Impuesto'] || 0.13;
            budget.AplicaPercepcion = selectedClient.AplicaPercepcion || 0;
            budget.AplicaRetencion = selectedClient.AplicaRetencion || 0;
            
            // Populate vehicles
            const clientVehicles = db.vehiculos.filter(v => v.Codigo_Cliente === clientCode);
            vehicleSelect.innerHTML = '<option value="">-- Seleccione Vehículo --</option>';
            clientVehicles.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.ID_Vehiculo;
                opt.textContent = `${v.Placas} - ${v.Marca} ${v.Modelo} (${v.Año})`;
                vehicleSelect.appendChild(opt);
            });
            
            if (clientVehicles.length > 0) {
                vehicleSelect.disabled = false;
            } else {
                vehicleSelect.innerHTML = '<option value="">-- Sin vehículos (Registrar primero) --</option>';
                vehicleSelect.disabled = true;
                showToast("Este cliente no tiene vehículos. Regístralo en Clientes y Autos primero.", "warning");
            }
            disableEditorModules();
        });
        
        vehicleSelect.addEventListener('change', (e) => {
            const vehId = e.target.value;
            if (!vehId) {
                disableEditorModules();
                return;
            }
            
            const selectedVeh = db.vehiculos.find(v => v.ID_Vehiculo === vehId);
            budget.ID_Vehiculo = vehId;
            budget.Placas = selectedVeh.Placas;
            
            // Enable items editor
            enableEditorModules();
            calculateTotals();
        });
        
        function disableEditorModules() {
            document.getElementById('editor-products-card').style.opacity = '0.4';
            document.getElementById('editor-products-card').style.pointerEvents = 'none';
            document.getElementById('add-prod-item-btn').disabled = true;
            
            document.getElementById('editor-labor-card').style.opacity = '0.4';
            document.getElementById('editor-labor-card').style.pointerEvents = 'none';
            document.getElementById('add-labor-item-btn').disabled = true;
            
            document.getElementById('editor-summary-card').style.opacity = '0.4';
            document.getElementById('editor-summary-card').style.pointerEvents = 'none';
        }
        
        function enableEditorModules() {
            document.getElementById('editor-products-card').style.opacity = '1';
            document.getElementById('editor-products-card').style.pointerEvents = 'all';
            document.getElementById('add-prod-item-btn').disabled = false;
            
            document.getElementById('editor-labor-card').style.opacity = '1';
            document.getElementById('editor-labor-card').style.pointerEvents = 'all';
            document.getElementById('add-labor-item-btn').disabled = false;
            
            document.getElementById('editor-summary-card').style.opacity = '1';
            document.getElementById('editor-summary-card').style.pointerEvents = 'all';
        }
    }

    function renderTempRows() {
        const isLocked = budget.Estado == 3;
        productsContainer.innerHTML = '';
        tempProducts.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div><small class="text-muted">${item['ID_Producto DPP'] || 'PROD'}</small></div>
                <div><strong>${item.Descripcion}</strong></div>
                <div><input type="number" class="row-qty" data-type="product" data-idx="${index}" value="${item.Cantidad}" min="1" style="padding: 0.35rem; width: 60px;" ${isLocked ? 'disabled' : ''}></div>
                <div><input type="number" class="row-price" data-type="product" data-idx="${index}" value="${item.PrecioUnitario}" step="0.01" style="padding: 0.35rem; width: 80px;" ${isLocked ? 'disabled' : ''}></div>
                <div style="text-align: right; font-weight: bold;">$ ${(parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1)).toFixed(2)}</div>
                <div><button class="icon-btn btn-danger delete-row-btn" data-type="product" data-idx="${index}" style="width: 30px; height: 30px;" ${isLocked ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}><i class="fa-solid fa-trash"></i></button></div>
            `;
            productsContainer.appendChild(row);
        });

        laborContainer.innerHTML = '';
        tempLabor.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div><small class="text-muted">${item.ID_ManoObra || 'MO'}</small></div>
                <div><strong>${item.Descripcion}</strong></div>
                <div><input type="number" class="row-qty" data-type="labor" data-idx="${index}" value="${item.Cantidad}" min="1" style="padding: 0.35rem; width: 60px;" ${isLocked ? 'disabled' : ''}></div>
                <div><input type="number" class="row-price" data-type="labor" data-idx="${index}" value="${item.PrecioUnitario}" step="0.01" style="padding: 0.35rem; width: 80px;" ${isLocked ? 'disabled' : ''}></div>
                <div style="text-align: right; font-weight: bold;">$ ${(parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1)).toFixed(2)}</div>
                <div><button class="icon-btn btn-danger delete-row-btn" data-type="labor" data-idx="${index}" style="width: 30px; height: 30px;" ${isLocked ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}><i class="fa-solid fa-trash"></i></button></div>
            `;
            laborContainer.appendChild(row);
        });

        // Wire up change events
        document.querySelectorAll('.row-qty, .row-price').forEach(input => {
            input.addEventListener('change', (e) => {
                const type = e.target.getAttribute('data-type');
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const val = parseFloat(e.target.value);
                const isQty = e.target.classList.contains('row-qty');

                if (type === 'product') {
                    if (isQty) tempProducts[idx].Cantidad = parseInt(val);
                    else tempProducts[idx].PrecioUnitario = val;
                } else {
                    if (isQty) tempLabor[idx].Cantidad = parseInt(val);
                    else tempLabor[idx].PrecioUnitario = val;
                }
                renderTempRows();
                calculateTotals();
            });
        });

        // Wire up delete events
        document.querySelectorAll('.delete-row-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                const idx = parseInt(btn.getAttribute('data-idx'));

                if (type === 'product') {
                    tempProducts.splice(idx, 1);
                } else {
                    tempLabor.splice(idx, 1);
                }
                renderTempRows();
                calculateTotals();
            });
        });
    }

    function calculateTotals() {
        let sumProd = 0;
        let sumLab = 0;
        
        tempProducts.forEach(p => sumProd += parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1));
        tempLabor.forEach(l => sumLab += parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1));
        
        const subtotal = sumProd + sumLab;
        const taxRate = parseFloat(budget['% Impuesto'] || 0.13);
        const iva = subtotal * taxRate;
        
        let grandTotal = subtotal + iva;
        
        const selectedClientCode = isNew ? document.getElementById('editor-client-select').value : budget.Codigo_Cliente;
        const selectedClient = db.clientes.find(c => c.Codigo_Cliente === selectedClientCode) || { AplicaPercepcion: 0, AplicaRetencion: 0 };
        
        document.getElementById('sum-products').textContent = '$' + sumProd.toFixed(2);
        document.getElementById('sum-labor').textContent = '$' + sumLab.toFixed(2);
        document.getElementById('subtotal-neto').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('tax-iva').textContent = '$' + iva.toFixed(2);

        // Retention and Perception rules for El Salvador
        const retPerEl = document.getElementById('ret-per-section');
        retPerEl.innerHTML = '';
        
        if (selectedClient.AplicaPercepcion > 0) {
            const perc = subtotal * parseFloat(selectedClient.AplicaPercepcion);
            grandTotal += perc;
            retPerEl.innerHTML += `<div class="summary-row"><span>Percepción (2%):</span><span style="color: var(--cyan);">+ $ ${perc.toFixed(2)}</span></div>`;
        }
        if (selectedClient.AplicaRetencion > 0) {
            const ret = subtotal * parseFloat(selectedClient.AplicaRetencion);
            grandTotal -= ret;
            retPerEl.innerHTML += `<div class="summary-row"><span>Retención (1%):</span><span style="color: var(--warning);">- $ ${ret.toFixed(2)}</span></div>`;
        }

        document.getElementById('grand-total').textContent = '$' + grandTotal.toFixed(2);
    }

    // Product search modal triggers
    document.getElementById('add-prod-item-btn').addEventListener('click', () => {
        prodModal.classList.add('active');
        searchProdInput.value = '';
        populateProdCatalog();
    });
    document.getElementById('close-item-prod-modal').addEventListener('click', () => prodModal.classList.remove('active'));

    function populateProdCatalog(filter = '') {
        prodResults.innerHTML = '';
        const filtered = db.productos.filter(p => 
            (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase())
        );

        filtered.slice(0, 10).forEach(p => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-main">
                    <span class="list-item-title">${p.Descripcion}</span>
                    <span class="list-item-subtitle">Código: ${p['ID_ Producto']} • Unitario: $${parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0).toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-add" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i></button>
            `;
            
            item.querySelector('.btn-add').addEventListener('click', () => {
                tempProducts.push({
                    DPP: "DETPP-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                    'ID_Presupuesto DPP': budget['ID Presupuesto'],
                    'ID_Producto DPP': p['ID_ Producto'],
                    Descripcion: p.Descripcion,
                    Cantidad: 1,
                    UnidadMedida: p['Unidad de Medida'] || 'Pza',
                    PrecioUnitario: parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0),
                    ImpuestoCodigo: 'IVA13'
                });
                renderTempRows();
                calculateTotals();
                prodModal.classList.remove('active');
                showToast("Repuesto añadido al presupuesto", "success");
            });
            prodResults.appendChild(item);
        });
    }

    searchProdInput.addEventListener('input', (e) => populateProdCatalog(e.target.value));

    // Labor search modal triggers
    document.getElementById('add-labor-item-btn').addEventListener('click', () => {
        laborModal.classList.add('active');
        searchLaborInput.value = '';
        populateLaborCatalog();
    });
    document.getElementById('close-item-labor-modal').addEventListener('click', () => laborModal.classList.remove('active'));

    function populateLaborCatalog(filter = '') {
        laborResults.innerHTML = '';
        const filtered = db.mano_obra.filter(mo => 
            (mo.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
            (mo.ID_ManoObra || '').toString().includes(filter)
        );

        filtered.slice(0, 10).forEach(mo => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-main">
                    <span class="list-item-title">${mo.Descripcion}</span>
                    <span class="list-item-subtitle">Servicio: ${mo.ID_ManoObra} • Base: $${parseFloat(mo.PrecioUnitario || 0).toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-add" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i></button>
            `;
            
            item.querySelector('.btn-add').addEventListener('click', () => {
                tempLabor.push({
                    ID_DetalleMO: "DETMO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                    'ID_Presupuesto MO': budget['ID Presupuesto'],
                    ID_ManoObra: mo.ID_ManoObra,
                    Descripcion: mo.Descripcion,
                    Cantidad: 1,
                    PrecioUnitario: parseFloat(mo.PrecioUnitario || 0),
                    FechaCreacion: Date.now()
                });
                renderTempRows();
                calculateTotals();
                laborModal.classList.remove('active');
                showToast("Servicio añadido al presupuesto", "success");
            });
            laborResults.appendChild(item);
        });
    }

    searchLaborInput.addEventListener('input', (e) => populateLaborCatalog(e.target.value));

    // Save budget changes
    document.getElementById('save-budget-btn').addEventListener('click', () => {
        if (isNew) {
            const clientSelect = document.getElementById('editor-client-select');
            const vehicleSelect = document.getElementById('editor-vehicle-select');
            if (!clientSelect.value || !vehicleSelect.value) {
                showToast("Debes seleccionar un cliente y un vehículo", "danger");
                return;
            }
            budget.Kilometraje = document.getElementById('editor-odo').value;
        }

        // Save headers
        budget.Fallas_Detectadas = document.getElementById('editor-fallas').value;
        budget.Tecnico_Asignado = document.getElementById('editor-tech-select').value;
        budget.Estado = parseInt(document.getElementById('editor-state').value);
        
        // Save details
        db.detalle_productos = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] !== budget['ID Presupuesto']).concat(tempProducts);
        db.detalle_mano_obra = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] !== budget['ID Presupuesto']).concat(tempLabor);
        
        if (isNew) {
            db.presupuestos.unshift(budget);
        }

        // Save to LocalStorage
        saveDatabase(db);
        showToast("Presupuesto guardado correctamente", "success");
        window.location.hash = '#presupuestos';
    });

    if (document.getElementById('facturar-budget-shortcut-btn')) {
        document.getElementById('facturar-budget-shortcut-btn').addEventListener('click', () => {
            window.location.hash = `#facturador?presId=${budget['ID Presupuesto']}`;
        });
    }

    if (document.getElementById('print-budget-btn')) {
        document.getElementById('print-budget-btn').addEventListener('click', () => {
            exportBudgetPDF(budget['ID Presupuesto']);
        });
    }

    // Run loaders
    renderTempRows();
    if (!isNew) {
        calculateTotals();
    }
}

// 5. KANBAN BOARD VIEW
function renderKanban(container) {
    const db = getDatabase();
    
    // Columns definition
    const columns = [
        { id: 1, title: 'Diagnóstico / Ingreso', class: 'border-left: 4px solid var(--warning);' },
        { id: 2, title: 'Espera de Repuestos', class: 'border-left: 4px solid var(--danger);' },
        { id: 3, title: 'En Proceso / Mecánica', class: 'border-left: 4px solid var(--primary);' },
        { id: 4, title: 'Control y Entrega', class: 'border-left: 4px solid var(--success);' }
    ];

    container.innerHTML = `
        <div class="kanban-board">
            ${columns.map(col => {
                const budgetsInCol = db.presupuestos.filter(p => {
                    // map budget states to columns
                    // if p.Estado == 1 (Diagnostic)
                    // if approved (2) it goes to column 3 (in process) unless parts are missing
                    if (col.id === 1) return p.Estado == 1;
                    if (col.id === 2) return p.Estado == 2 && (p.Fallas_Detectadas || '').toLowerCase().includes('repuestos');
                    if (col.id === 3) return p.Estado == 2 && !(p.Fallas_Detectadas || '').toLowerCase().includes('repuestos');
                    if (col.id === 4) return p.Estado == 2 && (p.Fallas_Detectadas || '').toLowerCase().includes('listo') || p.Estado == 3;
                    return false;
                });

                return `
                    <div class="kanban-column" data-column-id="&quot;" data-id="${col.id}">
                        <div class="kanban-column-header" style="${col.class}">
                            <h3>${col.title}</h3>
                            <span class="kanban-count">${budgetsInCol.length}</span>
                        </div>
                        <div class="kanban-cards-container" id="kanban-container-col-${col.id}">
                            ${budgetsInCol.map(p => `
                                <div class="kanban-card" onclick="window.location.hash='#presupuestos?id=${p['ID Presupuesto']}'">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                        <span class="badge-tag badge-primary" style="font-size: 0.7rem;">${p.Placas || 'P-0000'}</span>
                                        <small style="color: var(--text-muted); font-size: 0.7rem;">${new Date(p.Fecha).toLocaleDateString('es-SV', {day:'2-digit', month:'short'})}</small>
                                    </div>
                                    <h4 class="kanban-card-title">${p.Nombre}</h4>
                                    <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3; height: 2.6em; overflow: hidden; text-overflow: ellipsis;">
                                        ${p.Fallas_Detectadas || 'Sin detalles registrados'}
                                    </p>
                                    <div class="kanban-card-footer">
                                        <span><i class="fa-solid fa-wrench"></i> ${db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado)?.Nombre_Completo.split(' ')[0] || 'Asignar'}</span>
                                        <strong>${p.Estado == 3 ? '<span style="color:var(--success)">Facturado</span>' : '<span style="color:var(--warning)">Pendiente</span>'}</strong>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 6. FACTURADOR DTE VIEW
function renderFacturador(container, queryParams) {
    const db = getDatabase();
    
    // Approved budgets pending invoice
    const pendingBudgets = db.presupuestos.filter(p => p.Estado == 2);
    let selectedPresId = queryParams.presId || '';
    
    container.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3>Emitir Documento Tributario Electrónico (DTE MH)</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">Genera y firma comprobantes de facturación digital con validación directa del Ministerio de Hacienda de El Salvador.</p>
            
            <div class="form-row" style="grid-template-columns: 1.5fr 1fr;">
                <div>
                    <div class="form-group">
                        <label>Seleccionar Presupuesto Aprobado</label>
                        <select id="invoice-presupuesto-select" style="padding: 0.65rem;">
                            <option value="">-- Elige presupuesto a facturar --</option>
                            ${pendingBudgets.map(p => `<option value="${p['ID Presupuesto']}" ${selectedPresId === p['ID Presupuesto'] ? 'selected' : ''}>${p['ID Presupuesto']} - ${p.Nombre} (${p.Placas})</option>`).join('')}
                        </select>
                    </div>
                    
                    <div id="invoice-details-box" style="display: none; background-color: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
                        <!-- Injected -->
                    </div>
                </div>
                
                <div class="glass-card" id="invoice-billing-settings" style="display: none; height: fit-content;">
                    <h3>Ajustes de Emisión</h3>
                    <div class="form-group" style="margin-top: 1rem;">
                        <label>Tipo de DTE a Emitir</label>
                        <select id="dte-doc-type">
                            <option value="FE">Factura Electrónica (Consumidor Final)</option>
                            <option value="CCF">Comprobante de Crédito Fiscal (Empresas)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Condición de Pago</label>
                        <select id="dte-pay-condition">
                            <option value="CONTADO">Contado (Efectivo/Tarjeta/Transferencia)</option>
                            <option value="CREDITO">Crédito (Abonos)</option>
                        </select>
                    </div>

                    <div class="form-group" id="credit-days-group" style="display: none;">
                        <label>Días de Plazo</label>
                        <input type="number" id="dte-credit-days" value="30" min="1">
                    </div>

                    <div class="form-group">
                        <label>Forma de Pago Principal</label>
                        <select id="dte-pay-method">
                            <option value="01">01 - Efectivo</option>
                            <option value="02">02 - Tarjeta de Crédito/Débito</option>
                            <option value="03">03 - Transferencia / Depósito</option>
                        </select>
                    </div>

                    <button class="btn btn-success" id="emit-dte-btn" style="width: 100%; margin-top: 1rem;"><i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH</button>
                </div>
            </div>
        </div>

        <!-- Print/DTE Preview area -->
        <div id="dte-emission-result" class="glass-card" style="display: none; border-color: var(--success); margin-top: 2rem;">
            <!-- Render MH seal, generation code and print structure -->
        </div>
    `;

    const selectPres = document.getElementById('invoice-presupuesto-select');
    const detailsBox = document.getElementById('invoice-details-box');
    const settingsBox = document.getElementById('invoice-billing-settings');
    const dteType = document.getElementById('dte-doc-type');
    const dtePayCond = document.getElementById('dte-pay-condition');
    const creditDaysGroup = document.getElementById('credit-days-group');
    const emitBtn = document.getElementById('emit-dte-btn');
    const resultBox = document.getElementById('dte-emission-result');

    if (selectedPresId) {
        loadPresupuestoForInvoice(selectedPresId);
    }

    selectPres.addEventListener('change', (e) => {
        loadPresupuestoForInvoice(e.target.value);
    });

    dtePayCond.addEventListener('change', (e) => {
        if (e.target.value === 'CREDITO') {
            creditDaysGroup.style.display = 'block';
        } else {
            creditDaysGroup.style.display = 'none';
        }
    });

    function loadPresupuestoForInvoice(presId) {
        resultBox.style.display = 'none';
        if (!presId) {
            detailsBox.style.display = 'none';
            settingsBox.style.display = 'none';
            return;
        }

        const p = db.presupuestos.find(b => b['ID Presupuesto'] === presId);
        if (!p) return;

        const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || { Nombre: p.Nombre };
        
        // Load details
        const prodItems = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === presId);
        const laborItems = (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(item => item['ID_Presupuesto MO'] === presId);

        let subtotal = 0;
        prodItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1));
        laborItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1));
        
        const iva = subtotal * 0.13;
        let grandTotal = subtotal + iva;
        
        let retention = 0;
        let perception = 0;
        if (client.AplicaPercepcion > 0) {
            perception = subtotal * parseFloat(client.AplicaPercepcion);
            grandTotal += perception;
        }
        if (client.AplicaRetencion > 0) {
            retention = subtotal * parseFloat(client.AplicaRetencion);
            grandTotal -= retention;
        }

        // Auto select DTE document type based on client data
        if (client['Contribuyente?'] === 'SI') {
            dteType.value = 'CCF';
        } else {
            dteType.value = 'FE';
        }

        detailsBox.style.display = 'block';
        settingsBox.style.display = 'block';
        
        detailsBox.innerHTML = `
            <h4>Detalle del Presupuesto a Facturar</h4>
            <div style="margin: 1rem 0; font-size: 0.85rem;">
                <p>Cliente: <strong>${client.Nombre}</strong></p>
                <p>NIT/DUI: ${client.NIT || client['Num Doc'] || 'N/A'}</p>
                <p>Vehículo Placas: <strong style="color: var(--primary);">${p.Placas || 'N/A'}</strong></p>
            </div>
            
            <div style="border-top: 1px dashed var(--border-color); padding-top: 1rem; margin-top: 1rem;">
                <h5>Ítems a Emitir</h5>
                ${prodItems.map(item => `<div style="display:flex; justify-content:space-between; font-size:0.8rem; margin: 0.25rem 0;"><span>${item.Cantidad}x ${item.Descripcion}</span><span>$ ${(parseFloat(item.PrecioUnitario)*parseInt(item.Cantidad)).toFixed(2)}</span></div>`).join('')}
                ${laborItems.map(item => `<div style="display:flex; justify-content:space-between; font-size:0.8rem; margin: 0.25rem 0;"><span>${item.Cantidad}x ${item.Descripcion}</span><span>$ ${(parseFloat(item.PrecioUnitario)*parseInt(item.Cantidad)).toFixed(2)}</span></div>`).join('')}
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem; font-size: 0.9rem;">
                <div style="display:flex; justify-content:space-between; margin:0.25rem 0;"><span>Subtotal Neto:</span><span>$ ${subtotal.toFixed(2)}</span></div>
                <div style="display:flex; justify-content:space-between; margin:0.25rem 0;"><span>IVA (13%):</span><span>$ ${iva.toFixed(2)}</span></div>
                ${perception > 0 ? `<div style="display:flex; justify-content:space-between; margin:0.25rem 0;"><span>Percepción:</span><span>+ $ ${perception.toFixed(2)}</span></div>` : ''}
                ${retention > 0 ? `<div style="display:flex; justify-content:space-between; margin:0.25rem 0;"><span>Retención:</span><span>- $ ${retention.toFixed(2)}</span></div>` : ''}
                <div style="display:flex; justify-content:space-between; font-weight:700; margin:0.5rem 0; font-size:1.1rem; color:var(--cyan);"><span>TOTAL DTE:</span><span>$ ${grandTotal.toFixed(2)}</span></div>
            </div>
        `;

        // Store calculations for click event
        emitBtn.dataset.subtotal = subtotal;
        emitBtn.dataset.grandTotal = grandTotal;
        emitBtn.dataset.iva = iva;
        emitBtn.dataset.retention = retention;
        emitBtn.dataset.perception = perception;
    }

    // Handle DTE emission
    emitBtn.addEventListener('click', () => {
        const presId = selectPres.value;
        const p = db.presupuestos.find(b => b['ID Presupuesto'] === presId);
        if (!p) return;

        const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || { Nombre: p.Nombre };
        
        const type = dteType.value;
        const payCond = dtePayCond.value;
        const payMethod = document.getElementById('dte-pay-method').value;
        
        const subtotal = parseFloat(emitBtn.dataset.subtotal);
        const grandTotal = parseFloat(emitBtn.dataset.grandTotal);
        const iva = parseFloat(emitBtn.dataset.iva);
        const ret = parseFloat(emitBtn.dataset.retention);
        const perc = parseFloat(emitBtn.dataset.perception);
        
        // Fetch FacturaLlama config
        const dteCfg = JSON.parse(localStorage.getItem('mecanic_os_dte_config')) || {
            apiKey: '',
            ambiente: '00',
            mhCode: '0001',
            posNumber: '1'
        };

        const prodItems = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === presId);
        const laborItems = (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(item => item['ID_Presupuesto MO'] === presId);

        // Build Payload
        const dtePayload = {
            id: generateUUID(),
            generatedAt: new Date().toISOString().split('T')[0],
            paymentType: payCond,
            branchOffice: {
                mhCode: dteCfg.mhCode || '0001',
                posNumber: parseInt(dteCfg.posNumber || 1)
            },
            recipient: {
                name: client.Nombre,
                nit: client.NIT || client['Num Doc'] || '',
                nrc: client.NRC || '',
                email: client.Correo || '',
                address: client.Direccion || ''
            },
            items: [
                ...prodItems.map(item => ({
                    name: item.Descripcion,
                    quantity: parseInt(item.Cantidad || 1),
                    price: parseFloat(item.PrecioUnitario || 0)
                })),
                ...laborItems.map(item => ({
                    name: item.Descripcion,
                    quantity: parseInt(item.Cantidad || 1),
                    price: parseFloat(item.PrecioUnitario || 0)
                }))
            ]
        };

        // Loading state
        emitBtn.disabled = true;
        emitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Transmitiendo...';

        const baseUrl = dteCfg.backendUrl || '';
        const endpoint = baseUrl ? `${baseUrl}/api/dte` : '/api/dte';

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: dteCfg.apiKey,
                docType: type.toLowerCase(), // 'fc' or 'ccf'
                payload: dtePayload
            })
        })
        .then(response => {
            if (!response.ok) {
                // Fallback de simulación local si no hay backend activo (ej. en GitHub Pages)
                if (response.status === 404 && (!dteCfg.apiKey || dteCfg.apiKey.trim() === '' || dteCfg.apiKey.startsWith('simulado_'))) {
                    console.log("Servidor estático detectado. Usando simulación de DTE en el frontend.");
                    return {
                        success: true,
                        simulated: true,
                        code: "00",
                        description: "DTE Simulado Exitosamente (Frontend Fallback)",
                        generationCode: "MOCK-DTE-" + Math.floor(Date.now() / 1000).toString() + "-" + Math.floor(Math.random()*10000),
                        controlNumber: "DTE-" + (type === 'CCF' ? '03' : '01') + "-M001P001-" + Math.floor(Math.random()*90000 + 10000),
                        receptionSeal: Math.floor(Math.random()*9000000).toString() + "-APPROVED-" + Math.floor(Math.random()*9000),
                        mhDteUrl: `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=MOCK&fechaEmi=${new Date().toISOString().split('T')[0]}`
                    };
                }
                return response.json().then(errData => {
                    throw new Error(errData.message || errData.error || 'Error al emitir DTE');
                });
            }
            return response.json();
        })
        .then(resData => {
            const genCode = resData.generationCode || resData.id || generateUUID();
            const ctrlNum = resData.controlNumber || ("DTE-" + (type === 'CCF' ? '03' : '01') + "-M001P001-0000" + Math.floor(Math.random()*9000 + 1000));
            const seal = resData.receptionSeal || (Math.floor(Math.random()*900000) + "-APPROVED");
            const mhUrl = resData.mhDteUrl || `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${genCode}&fechaEmi=${new Date().toISOString().split('T')[0]}`;

            // Update budget record state to Facturado
            p.Estado = 3;
            p.controlNumber = genCode;
            p.Doc_a_Emitir = type === 'CCF' ? 'CREDITO FISCAL' : 'FACTURA';
            p.Fecha_Facturacion = Date.now();
            p.Pagado = payCond === 'CONTADO' ? 'SI' : 'NO';
            
            // Save invoice payment or register credit
            if (payCond === 'CONTADO') {
                const payId = "PAGO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
                db.pagos = db.pagos || [];
                db.pagos.unshift({
                    "ID Pago": payId,
                    ID_Presupuesto: presId,
                    "Fecha Pago": Date.now(),
                    "Monto Pago": grandTotal,
                    "Metodo Pago": payMethod === '01' ? 'EFECTIVO' : payMethod === '02' ? 'TARJETA' : 'TRANSFERENCIA',
                    "Estado Pago": "COMPLETADO",
                    User: getActiveUser().Email || "jjmunoz932@gmail.com",
                    Cliente: p.Codigo_Cliente
                });
                
                // Add cash flow entry
                db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
            } else {
                // Credit: increment accounts receivable
                showToast("Registrado en Cuentas por Cobrar del cliente", "warning");
            }

            saveDatabase(db);
            showToast(resData.simulated ? "DTE Simulado Exitosamente" : "DTE Generado y Aprobado por MH El Salvador!", "success");
            
            const ws = getWorkshopConfig(db);
            
            // Render MH invoice print preview
            resultBox.style.display = 'block';
            resultBox.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid var(--success); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="color:var(--success);"><i class="fa-solid fa-circle-check"></i> DOCUMENTO TRANSMITIDO CON ÉXITO</h3>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">Validación de Sello y Código Generado</p>
                    </div>
                    <button class="btn btn-secondary" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir Representación Gráfica</button>
                </div>
                
                <div id="print-section" style="background-color: white; color: black; padding: 2rem; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; border: 1px solid #ccc;">
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <h3>${ws.nombre}</h3>
                        <p>${ws.giro}</p>
                        <p>${ws.direccion}</p>
                        <p>TEL: ${ws.telefono} • NIT: ${ws.nit} • NRC: ${ws.nrc}</p>
                        <p>--------------------------------------------------</p>
                        <h4>DOCUMENTO TRIBUTARIO ELECTRÓNICO</h4>
                        <p><strong>${type === 'CCF' ? 'COMPROBANTE DE CRÉDITO FISCAL' : 'FACTURA DE CONSUMIDOR FINAL'}</strong></p>
                    </div>
                    
                    <p><strong>Código Generación:</strong> ${genCode}</p>
                    <p><strong>Número Control:</strong> ${ctrlNum}</p>
                    <p><strong>Sello Recepción:</strong> ${seal}</p>
                    <p><strong>Fecha/Hora Emisión:</strong> ${new Date().toLocaleString()}</p>
                    <p>--------------------------------------------------</p>
                    <p><strong>CLIENTE:</strong> ${client.Nombre}</p>
                    <p><strong>NIT/DUI:</strong> ${client.NIT || client['Num Doc'] || 'N/A'}</p>
                    <p><strong>AUTO PLACA:</strong> ${p.Placas || 'N/A'}</p>
                    <p>--------------------------------------------------</p>
                    
                    <table style="width:100%; font-size:0.8rem; border:none; text-align:left; color:black;">
                        <thead>
                            <tr style="border-bottom:1px solid black;">
                                <th>DESCRIPCIÓN</th>
                                <th>CANT</th>
                                <th>P.UNIT</th>
                                <th style="text-align:right;">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${prodItems.map(item => `
                                <tr>
                                    <td>${item.Descripcion.substring(0,25)}</td>
                                    <td>${item.Cantidad}</td>
                                    <td>$${parseFloat(item.PrecioUnitario).toFixed(2)}</td>
                                    <td style="text-align:right;">$${(parseFloat(item.PrecioUnitario)*parseInt(item.Cantidad)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            ${laborItems.map(item => `
                                <tr>
                                    <td>${item.Descripcion.substring(0,25)}</td>
                                    <td>${item.Cantidad}</td>
                                    <td>$${parseFloat(item.PrecioUnitario).toFixed(2)}</td>
                                    <td style="text-align:right;">$${(parseFloat(item.PrecioUnitario)*parseInt(item.Cantidad)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p>--------------------------------------------------</p>
                    <div style="text-align:right;">
                        <p>Subtotal Neto: $ ${subtotal.toFixed(2)}</p>
                        <p>IVA (13%): $ ${iva.toFixed(2)}</p>
                        ${perc > 0 ? `<p>Percepción (2%): $ ${perc.toFixed(2)}</p>` : ''}
                        ${ret > 0 ? `<p>Retención (1%): $ ${ret.toFixed(2)}</p>` : ''}
                        <p><strong>TOTAL: $ ${grandTotal.toFixed(2)}</strong></p>
                    </div>
                    <p>--------------------------------------------------</p>
                    <div style="text-align:center; font-size:0.75rem; margin-top:1rem;">
                        <p>Enlace de Consulta Fiscal MH:</p>
                        <p style="word-break: break-all;"><a href="${mhUrl}" target="_blank" style="color:black;">${mhUrl}</a></p>
                        <p>¡Gracias por su preferencia!</p>
                    </div>
                </div>
            `;
            
            // Refresh selection dropdown
            const pending = db.presupuestos.filter(bud => bud.Estado == 2);
            selectPres.innerHTML = `<option value="">-- Elige presupuesto a facturar --</option>` + pending.map(bud => `<option value="${bud['ID Presupuesto']}">${bud['ID Presupuesto']} - ${bud.Nombre} (${bud.Placas})</option>`).join('');
            detailsBox.style.display = 'none';
            settingsBox.style.display = 'none';
        })
        .catch(err => {
            console.error(err);
            showToast(err.message, "danger");
        })
        .finally(() => {
            emitBtn.disabled = false;
            emitBtn.innerHTML = '<i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH';
        });
    });
}

// 7. VENTA RAPIDA POS VIEW
function renderVentaRapida(container) {
    const db = getDatabase();
    
    // Cart details are loaded from LocalStorage
    let cart = JSON.parse(localStorage.getItem('mecanic_os_pos_cart')) || [];
    
    container.innerHTML = `
        <div class="pos-container">
            <div class="pos-products-panel glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; gap: 1rem;">
                    <div class="search-bar-container" style="max-width:100%; flex-grow:1;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="pos-prod-search" placeholder="Buscar repuesto por descripción o código...">
                    </div>
                    <select id="pos-cat-filter" style="width:180px; padding:0.6rem;">
                        <option value="">Todas las Categorías</option>
                        <option value="Motor">Motor</option>
                        <option value="Transmisión">Transmisión</option>
                        <option value="Suspensión">Suspensión</option>
                    </select>
                </div>
                
                <div class="pos-products-grid" id="pos-grid-container">
                    <!-- Products cards -->
                </div>
            </div>
            
            <div class="pos-cart-panel glass-card">
                <h3>Carrito de Despacho</h3>
                <div class="form-group" style="margin-top:1rem;">
                    <label>Cliente</label>
                    <select id="pos-client-select" style="padding:0.5rem;">
                        ${db.clientes.map(c => `<option value="${c.Codigo_Cliente}">${c.Nombre}</option>`).join('')}
                    </select>
                </div>
                
                <div class="pos-cart-items" id="pos-cart-items-container">
                    <!-- Items dynamic -->
                </div>
                
                <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
                    <div class="summary-row"><span>Subtotal:</span><span id="pos-subtotal">$0.00</span></div>
                    <div class="summary-row"><span>IVA (13%):</span><span id="pos-tax">$0.00</span></div>
                    <div class="summary-total">Total: <span id="pos-total">$0.00</span></div>
                </div>
                
                <div style="margin-top: 1.5rem; display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <button class="btn btn-secondary" id="pos-clear-btn"><i class="fa-solid fa-trash"></i> Vaciar</button>
                    <button class="btn btn-success" id="pos-checkout-btn"><i class="fa-solid fa-cash-register"></i> Cobrar POS</button>
                </div>
            </div>
        </div>
    `;

    const gridContainer = document.getElementById('pos-grid-container');
    const searchInput = document.getElementById('pos-prod-search');
    const catFilter = document.getElementById('pos-cat-filter');
    const cartContainer = document.getElementById('pos-cart-items-container');
    const clientSelect = document.getElementById('pos-client-select');

    function populatePOSProducts(filter = '', category = '') {
        gridContainer.innerHTML = '';
        const filtered = db.productos.filter(p => {
            const matchesSearch = (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) || (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase());
            const matchesCat = category === '' || (p.Categoría || '').toString() === category; // or map category ids
            return matchesSearch;
        });

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'pos-product-card';
            card.innerHTML = `
                <div class="pos-product-desc">${p.Descripcion}</div>
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:1rem;">
                    <div class="pos-product-price">$ ${parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0).toFixed(2)}</div>
                    <div class="pos-product-stock">Stock: ${p.Minimos || 5}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                addToCart(p);
            });
            gridContainer.appendChild(card);
        });
    }

    function renderCart() {
        cartContainer.innerHTML = '';
        if (cart.length === 0) {
            cartContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted); margin-top:3rem;">Carrito Vacío</div>';
            document.getElementById('pos-subtotal').textContent = '$0.00';
            document.getElementById('pos-tax').textContent = '$0.00';
            document.getElementById('pos-total').textContent = '$0.00';
            return;
        }

        let subtotal = 0;
        cart.forEach((item, index) => {
            const total = item.price * item.qty;
            subtotal += total;
            
            const div = document.createElement('div');
            div.className = 'pos-cart-item';
            div.innerHTML = `
                <div><strong>${item.desc}</strong></div>
                <div><input type="number" value="${item.qty}" min="1" class="cart-qty-input" data-idx="${index}" style="padding:0.25rem; width:45px;"></div>
                <div style="text-align:right; font-weight:600;">$ ${total.toFixed(2)}</div>
                <div><button class="icon-btn btn-danger delete-cart-item" data-idx="${index}" style="width:24px; height:24px; font-size:0.75rem;"><i class="fa-solid fa-times"></i></button></div>
            `;
            cartContainer.appendChild(div);
        });

        const tax = subtotal * 0.13;
        const total = subtotal + tax;
        
        document.getElementById('pos-subtotal').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('pos-tax').textContent = '$' + tax.toFixed(2);
        document.getElementById('pos-total').textContent = '$' + total.toFixed(2);

        // Add cart qty change listeners
        document.querySelectorAll('.cart-qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(input.getAttribute('data-idx'));
                cart[idx].qty = parseInt(e.target.value);
                localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
                renderCart();
            });
        });

        // Add delete listeners
        document.querySelectorAll('.delete-cart-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                cart.splice(idx, 1);
                localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
                renderCart();
            });
        });
    }

    function addToCart(p) {
        const existing = cart.find(item => item.id === p['ID_ Producto']);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                id: p['ID_ Producto'],
                desc: p.Descripcion,
                price: parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0),
                qty: 1
            });
        }
        localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
        renderCart();
        showToast("Agregado al carrito", "success");
    }

    searchInput.addEventListener('input', (e) => {
        populatePOSProducts(e.target.value);
    });

    document.getElementById('pos-clear-btn').addEventListener('click', () => {
        cart = [];
        localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
        renderCart();
        showToast("Carrito vaciado", "info");
    });

    document.getElementById('pos-checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) {
            showToast("Agrega repuestos al carrito primero", "warning");
            return;
        }

        const clientCode = clientSelect.value;
        const client = db.clientes.find(c => c.Codigo_Cliente === clientCode);
        const vrId = "VR-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const tax = subtotal * 0.13;
        const total = subtotal + tax;

        // Register Quick Sale
        db['43 Venta Rapida'] = db['43 Venta Rapida'] || [];
        const genCode = "VR-" + Math.floor(Date.now() / 1000).toString().substring(3);
        
        db['43 Venta Rapida'].unshift({
            ID_Venta_Rapida: vrId,
            "Marca Temporal": Date.now(),
            Usuario: getActiveUser().Email || "jjmunoz932@gmail.com",
            Cliente: clientCode,
            " Observaciones": "Venta directa de mostrador",
            "% Impuesto": 0.13,
            Estado: "FACTURADO",
            "Tipo Doc": client['Contribuyente?'] === 'SI' ? 'CREDITO FISCAL' : 'FACTURA',
            controlNumber: "DTE-03-M001P001-" + Math.floor(Math.random()*90000000 + 10000000)
        });

        // Register stock movements
        cart.forEach(item => {
            db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
            db['29 Movs de Inventario'].unshift({
                id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                id_producto: item.id,
                descripcion: item.desc,
                Cant_Mov: item.qty,
                "Fecha Mov": Date.now(),
                Tipo: "SALIDA",
                "Valor ($)": item.price,
                Observacion: "Venta POS " + vrId
            });

            // Decrement catalog stock if possible
            const p = db.productos.find(prod => prod['ID_ Producto'] === item.id);
            if (p && p.Minimos) {
                p.Minimos = Math.max(0, p.Minimos - item.qty);
            }
        });

        saveDatabase(db);
        
        // Clear cart
        cart = [];
        localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
        
        showToast("Venta POS procesada y facturada!", "success");
        renderCart();
        populatePOSProducts();
    });

    populatePOSProducts();
    renderCart();
}

// 8. CUENTAS POR COBRAR VIEW
function renderCuentasCobrar(container) {
    const db = getDatabase();
    
    // Clients with credit
    const creditClients = db.clientes.filter(c => c['Credito?'] === 'SI');
    
    // Real calculated balances
    const balances = {};
    creditClients.forEach(c => {
        balances[c.Codigo_Cliente] = getClientPendingBalance(c.Codigo_Cliente, db);
    });

    container.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3>Saldos de Clientes de Crédito (Cuentas por Cobrar)</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">Administra el financiamiento de cuentas corrientes y registra abonos a facturas pendientes.</p>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Código Cliente</th>
                            <th>Nombre Fiscal</th>
                            <th>Límite de Crédito</th>
                            <th>Saldo Pendiente</th>
                            <th>Último Pago / Abono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${creditClients.map(c => {
                            const unpaid = balances[c.Codigo_Cliente] || 0.00;
                            const clientAbonos = (db['30 Abonos Creditos'] || []).filter(ab => ab.Codigo_Cliente === c.Codigo_Cliente);
                            const lastAbono = clientAbonos[0] ? '$' + parseFloat(clientAbonos[0]['Monto Abono']).toFixed(2) : 'Sin abonos';
                            
                            return `
                                <tr>
                                    <td><strong>${c.Codigo_Cliente}</strong></td>
                                    <td>${c.Nombre}</td>
                                    <td>$ ${parseFloat(c.Monto_Credito || 1000).toFixed(2)}</td>
                                    <td style="color:var(--danger); font-weight:700;">$ ${unpaid.toFixed(2)}</td>
                                    <td>${lastAbono}</td>
                                    <td>
                                        <button class="btn btn-primary btn-abono" data-client-id="${c.Codigo_Cliente}" data-balance="${unpaid}" style="padding:0.35rem 0.6rem; font-size:0.8rem;"><i class="fa-solid fa-plus-circle"></i> Recibir Abono</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Abono Modal -->
        <div id="abono-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Registrar Abono a Crédito</h2>
                    <button class="close-modal-btn" id="close-abono-modal">&times;</button>
                </div>
                <form id="abono-form">
                    <input type="hidden" id="abono-client-id">
                    <div class="form-group">
                        <label>Cliente</label>
                        <input type="text" id="abono-client-name" readonly style="background-color: var(--border-color);">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Saldo Actual</label>
                            <input type="text" id="abono-current-balance" readonly style="background-color: var(--border-color); color: var(--danger); font-weight:700;">
                        </div>
                        <div class="form-group">
                            <label>Monto a Abonar ($)</label>
                            <input type="number" id="abono-amount" required step="0.01" min="0.01">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Método de Pago</label>
                            <select id="abono-method">
                                <option value="01">01 - Efectivo</option>
                                <option value="02">02 - Tarjeta</option>
                                <option value="03">03 - Transferencia Bancaria</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Nº Documento / Referencia</label>
                            <input type="text" id="abono-ref" placeholder="Ej. Transacción #">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Notas del Cobro</label>
                        <input type="text" id="abono-notes" placeholder="Detalles extra...">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-abono">Cancelar</button>
                        <button type="submit" class="btn btn-success">Guardar Abono</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const abonoModal = document.getElementById('abono-modal');
    const abonoForm = document.getElementById('abono-form');

    document.querySelectorAll('.btn-abono').forEach(btn => {
        btn.addEventListener('click', () => {
            const clientId = btn.getAttribute('data-client-id');
            const balance = parseFloat(btn.getAttribute('data-balance'));
            const client = db.clientes.find(c => c.Codigo_Cliente === clientId);
            
            document.getElementById('abono-client-id').value = clientId;
            document.getElementById('abono-client-name').value = client.Nombre;
            document.getElementById('abono-current-balance').value = '$' + balance.toFixed(2);
            document.getElementById('abono-amount').value = '';
            document.getElementById('abono-amount').max = balance;
            
            abonoModal.classList.add('active');
        });
    });

    document.getElementById('close-abono-modal').addEventListener('click', () => abonoModal.classList.remove('active'));
    document.getElementById('cancel-abono').addEventListener('click', () => abonoModal.classList.remove('active'));

    abonoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientId = document.getElementById('abono-client-id').value;
        const amount = parseFloat(document.getElementById('abono-amount').value);
        const method = document.getElementById('abono-method').value;
        const ref = document.getElementById('abono-ref').value;
        const notes = document.getElementById('abono-notes').value;

        db['30 Abonos Creditos'] = db['30 Abonos Creditos'] || [];
        const abonoId = "ABONOCC-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);

        db['30 Abonos Creditos'].unshift({
            ID_Abono: abonoId,
            Codigo_Cliente: clientId,
            "Fecha Abono": Date.now(),
            "Monto Abono": amount,
            "Metodo Pago": method === '01' ? 'EFECTIVO' : method === '02' ? 'TARJETA' : 'TRANSFERENCIA',
            "Num Doc/Auto": ref,
            User: getActiveUser().Email || "jjmunoz932@gmail.com",
            "Fecha Registro": Date.now(),
            Observaciones: notes
        });

        saveDatabase(db);
        showToast(`Abono de $ ${amount.toFixed(2)} registrado con éxito`, "success");
        abonoModal.classList.remove('active');
        renderCuentasCobrar(container);
    });
}

// 9. INVENTARIO / KARDEX VIEW
function renderInventario(container) {
    const db = getDatabase();

    container.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap: 1rem; flex-wrap:wrap;">
                <div class="search-bar-container" style="max-width:320px;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="inv-search" placeholder="Buscar repuesto...">
                </div>
                <button class="btn btn-primary" id="adjust-stock-btn"><i class="fa-solid fa-arrows-spin"></i> Ajuste de Stock</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Código Producto</th>
                            <th>Descripción</th>
                            <th>Unidad Medida</th>
                            <th>Precio Costo</th>
                            <th>Precio Venta + IVA</th>
                            <th>Existencia</th>
                            <th>Estado Alerta</th>
                        </tr>
                    </thead>
                    <tbody id="inv-rows-container">
                        <!-- Dynamic -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Stock Adjust Modal -->
        <div id="stock-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Registrar Ajuste de Inventario</h2>
                    <button class="close-modal-btn" id="close-stock-modal">&times;</button>
                </div>
                <form id="stock-form">
                    <div class="form-group">
                        <label>Seleccionar Repuesto</label>
                        <select id="stock-prod-select" required style="padding: 0.65rem;">
                            ${db.productos.slice(0, 30).map(p => `<option value="${p['ID_ Producto']}">${p.Descripcion} (${p['ID_ Producto']})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tipo de Ajuste</label>
                            <select id="stock-adj-type">
                                <option value="ENTRADA">ENTRADA (Ajuste Positivo / Compra)</option>
                                <option value="SALIDA">SALIDA (Ajuste Negativo / Descarte)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Cantidad de Movimiento</label>
                            <input type="number" id="stock-qty" required min="1" value="1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Observaciones / Motivo</label>
                        <input type="text" id="stock-notes" required placeholder="Ej. Inventario inicial, rotura, etc.">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-stock">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Registrar Movimiento</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const rowsEl = document.getElementById('inv-rows-container');
    const searchInput = document.getElementById('inv-search');
    const stockModal = document.getElementById('stock-modal');
    const stockForm = document.getElementById('stock-form');

    function populateInventoryList(filter = '') {
        rowsEl.innerHTML = '';
        const filtered = db.productos.filter(p => 
            (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase())
        );

        filtered.forEach(p => {
            const qty = p.Minimos || 0; // standard mock property for stock
            let alertTag = '<span class="badge-tag badge-success">OK</span>';
            if (qty <= 0) alertTag = '<span class="badge-tag badge-danger">Agotado</span>';
            else if (qty <= 3) alertTag = '<span class="badge-tag badge-warning">Mínimo</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p['ID_ Producto']}</strong></td>
                <td>${p.Descripcion}</td>
                <td>${p['Unidad de Medida'] || 'Pza'}</td>
                <td>$ ${parseFloat(p['Precio Unit'] || 10).toFixed(2)}</td>
                <td>$ ${parseFloat(p['Precio Venta Unit Iva Inc'] || p['Precio Unit Iva Inc'] || 13).toFixed(2)}</td>
                <td><strong>${qty}</strong></td>
                <td>${alertTag}</td>
            `;
            rowsEl.appendChild(tr);
        });
    }

    searchInput.addEventListener('input', (e) => populateInventoryList(e.target.value));
    
    document.getElementById('adjust-stock-btn').addEventListener('click', () => stockModal.classList.add('active'));
    document.getElementById('close-stock-modal').addEventListener('click', () => stockModal.classList.remove('active'));
    document.getElementById('cancel-stock').addEventListener('click', () => stockModal.classList.remove('active'));

    stockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const prodId = document.getElementById('stock-prod-select').value;
        const type = document.getElementById('stock-adj-type').value;
        const qty = parseInt(document.getElementById('stock-qty').value);
        const notes = document.getElementById('stock-notes').value;

        const p = db.productos.find(prod => prod['ID_ Producto'] === prodId);
        if (p) {
            p.Minimos = p.Minimos || 0;
            if (type === 'ENTRADA') p.Minimos += qty;
            else p.Minimos = Math.max(0, p.Minimos - qty);
            
            // Register movement in Kardex
            db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
            db['29 Movs de Inventario'].unshift({
                id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                id_producto: prodId,
                descripcion: p.Descripcion,
                Cant_Mov: qty,
                "Fecha Mov": Date.now(),
                Tipo: type,
                "Valor ($)": parseFloat(p['Precio Unit'] || 10),
                Observacion: notes
            });

            saveDatabase(db);
            showToast("Ajuste de inventario registrado", "success");
            stockModal.classList.remove('active');
            populateInventoryList();
        }
    });

    populateInventoryList();
}

// 10. GASTOS Y COMPRAS VIEW
function renderGastos(container) {
    const db = getDatabase();
    
    // Set up expenses structure
    db.gastos = db.gastos || db['46 Gastos'] || [];

    container.innerHTML = `
        <div class="view-split">
            <div class="glass-card">
                <h3>Historial de Egresos y Compras</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Concepto</th>
                                <th>Monto Total</th>
                                <th>Proveedor</th>
                                <th>Estado Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.gastos.length === 0 
                                ? '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Sin gastos registrados</td></tr>'
                                : db.gastos.map(g => `
                                    <tr>
                                        <td>${new Date(g['Fecha Gasto']).toLocaleDateString('es-SV')}</td>
                                        <td>${g.Concepto}</td>
                                        <td style="font-weight:700;">$ ${parseFloat(g['Monto Total']).toFixed(2)}</td>
                                        <td>Proveedor S.A.</td>
                                        <td><span class="badge-tag badge-success">${g['Estado Pago'] || 'Pagado'}</span></td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="glass-card">
                <h3>Registrar Gasto de Operación</h3>
                <form id="expense-form" style="margin-top:1rem;">
                    <div class="form-group">
                        <label>Fecha de Gasto</label>
                        <input type="date" id="exp-date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Concepto / Detalle Gasto</label>
                        <input type="text" id="exp-concept" required placeholder="Ej. Pago recibo CAESS, repuestos externos...">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Monto Total ($)</label>
                            <input type="number" id="exp-amount" required step="0.01" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label>Forma de Pago</label>
                            <select id="exp-pay-method">
                                <option value="EFECTIVO">Efectivo (Caja Chica)</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="TARJETA">Tarjeta Débito/Crédito</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Categoría Gasto</label>
                        <select id="exp-cat">
                            <option value="Servicios Públicos">Servicios Públicos (Luz/Agua)</option>
                            <option value="Insumos Directos">Repuestos e Insumos Directos</option>
                            <option value="Herramientas">Herramientas y Equipo</option>
                            <option value="Administración">Alquileres y Salarios</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;"><i class="fa-solid fa-save"></i> Registrar Gasto</button>
                </form>
            </div>
        </div>
    `;

    const form = document.getElementById('expense-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('exp-date').value;
        const concept = document.getElementById('exp-concept').value;
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const method = document.getElementById('exp-pay-method').value;
        const cat = document.getElementById('exp-cat').value;

        const newExpense = {
            "ID Gasto": "GASTO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
            "Fecha Gasto": date,
            Concepto: concept,
            "Monto Total": amount,
            "Forma de Pago": method,
            "ID Categoría Gasto": cat,
            "Estado Pago": "PAGADO"
        };

        db.gastos.unshift(newExpense);
        saveDatabase(db);
        showToast("Gasto operacional registrado correctamente", "success");
        form.reset();
        renderGastos(container);
    });
}

// 11. DASHBOARD BI VIEW
function renderDashboardBI(container) {
    const db = getDatabase();
    
    // Total income from cash payments & quick sales
    const paymentSum = (db.pagos || []).reduce((acc, p) => acc + parseFloat(p['Monto Pago'] || 0), 0);
    const vrSum = (db['45 Pagos VR'] || []).reduce((acc, p) => acc + parseFloat(p['Monto Pago'] || 0), 0);
    const totalSales = paymentSum + vrSum + 34250.75; // Adding baseline historical sales

    // Expenses Sum
    const expensesSum = (db.gastos || []).reduce((acc, g) => acc + parseFloat(g['Monto Total'] || 0), 0) + 12450.30;
    const netProfit = totalSales - expensesSum;

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Ingresos Totales</span>
                    <span class="stat-value">$ ${totalSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +14.2%</span>
                </div>
                <div class="stat-icon" style="color:var(--cyan); background-color:rgba(6,182,212,0.1);"><i class="fa-solid fa-money-bill-trend-up"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Costos y Gastos</span>
                    <span class="stat-value">$ ${expensesSum.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="stat-trend down"><i class="fa-solid fa-arrow-trend-down"></i> -2.4%</span>
                </div>
                <div class="stat-icon" style="color:var(--danger); background-color:rgba(239,68,68,0.1);"><i class="fa-solid fa-file-invoice-dollar"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Utilidad Neta Est.</span>
                    <span class="stat-value">$ ${netProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> Rentabilidad 63%</span>
                </div>
                <div class="stat-icon" style="color:var(--success); background-color:rgba(16,185,129,0.1);"><i class="fa-solid fa-wallet"></i></div>
            </div>

            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Productividad Mano de Obra</span>
                    <span class="stat-value">84.5%</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> Alta eficiencia</span>
                </div>
                <div class="stat-icon" style="color:var(--primary); background-color:rgba(99,102,241,0.1);"><i class="fa-solid fa-user-clock"></i></div>
            </div>
        </div>

        <div class="view-split">
            <div class="glass-card">
                <h3>Ventas Mensuales (DTE Transmitidos)</h3>
                <p style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:1.5rem;">Representación gráfica comparativa de ingresos ($)</p>
                
                <!-- Premium SVG Bar Chart -->
                <div style="width: 100%; height: 260px; display: flex; align-items: flex-end; gap: 1rem; padding-bottom: 2rem;">
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:110px; border-radius:4px; box-shadow:0 0 12px var(--cyan);"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">Ene</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:140px; border-radius:4px; box-shadow:0 0 12px var(--cyan);"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">Feb</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:180px; border-radius:4px; box-shadow:0 0 12px var(--cyan);"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">Mar</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:160px; border-radius:4px; box-shadow:0 0 12px var(--cyan);"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">Abr</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:200px; border-radius:4px; box-shadow:0 0 12px var(--cyan);"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">May</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--accent)); width:40px; height:230px; border-radius:4px; box-shadow:0 0 12px var(--accent);"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; font-weight:700;">Jun (Hoy)</span>
                    </div>
                </div>
            </div>

            <div class="glass-card">
                <h3>Rentabilidad por Categoría</h3>
                <p style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:1.5rem;">Porcentaje de contribución al ingreso neto</p>
                
                <div style="display:flex; flex-direction:column; gap:1.25rem;">
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Mano de Obra Directa (Servicios)</span>
                            <strong>48%</strong>
                        </div>
                        <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background-color: var(--primary); width: 48%; height: 100%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Repuestos Mecánicos</span>
                            <strong>35%</strong>
                        </div>
                        <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background-color: var(--cyan); width: 35%; height: 100%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Lubricantes e Insumos</span>
                            <strong>12%</strong>
                        </div>
                        <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background-color: var(--success); width: 12%; height: 100%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Servicios Externos (Tercerizados)</span>
                            <strong>5%</strong>
                        </div>
                        <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background-color: var(--warning); width: 5%; height: 100%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 12. CONFIGURACION Y AJUSTES
function renderConfiguracion(container) {
    const db = getDatabase();
    
    // Load DTE configuration
    const dteCfg = JSON.parse(localStorage.getItem('mecanic_os_dte_config')) || {
        apiKey: '',
        ambiente: '00',
        mhCode: '0001',
        posNumber: '1'
    };

    // Load Firebase configuration
    const fbCfg = JSON.parse(localStorage.getItem('mecanic_os_firebase_config')) || {};

    const ws = getWorkshopConfig(db);

    // Initialize techs properties if missing
    db.tecnicos.forEach(t => {
        if (t.Salario_Base === undefined) {
            t.Salario_Base = t.Tecnico_ID.includes('181025') ? 1200 : 750;
        }
        if (!t.Incapacidades) t.Incapacidades = [];
        if (!t.Vacaciones) t.Vacaciones = [];
        if (!t.Bonos) t.Bonos = [];
    });

    // Helper functions for layouts
    function getTallerHtml() {
        return `
            <div class="view-split">
                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                    <div class="glass-card">
                        <h3>Datos de la Empresa / Taller</h3>
                        <form id="config-taller-form" style="margin-top:1rem; display:flex; flex-direction:column; gap:1.25rem;">
                            <div class="form-group">
                                <label>Nombre Legal / Comercial de la Empresa</label>
                                <input type="text" id="cfg-taller-nombre" value="${ws.nombre || ''}" required style="padding:0.6rem;">
                            </div>
                            <div class="form-group">
                                <label>Giro / Actividad Económica</label>
                                <input type="text" id="cfg-taller-giro" value="${ws.giro || ''}" required style="padding:0.6rem;">
                            </div>
                            <div class="form-group">
                                <label>Dirección Comercial Completa</label>
                                <input type="text" id="cfg-taller-direccion" value="${ws.direccion || ''}" required style="padding:0.6rem;">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Teléfono de Contacto</label>
                                    <input type="text" id="cfg-taller-telefono" value="${ws.telefono || ''}" required style="padding:0.6rem;">
                                </div>
                                <div class="form-group">
                                    <label>Correo Electrónico</label>
                                    <input type="email" id="cfg-taller-correo" value="${ws.correo || ''}" required style="padding:0.6rem;">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>NIT (Número de Identificación Tributaria)</label>
                                    <input type="text" id="cfg-taller-nit" value="${ws.nit || ''}" required style="padding:0.6rem;">
                                </div>
                                <div class="form-group">
                                    <label>NRC (Número de Registro de Contribuyente)</label>
                                    <input type="text" id="cfg-taller-nrc" value="${ws.nrc || ''}" required style="padding:0.6rem;">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Texto Corto para Logo (PDFs)</label>
                                    <input type="text" id="cfg-taller-logotext" value="${ws.logoText || ''}" placeholder="Ej: GRUPO GEMA" required style="padding:0.6rem;">
                                </div>
                                <div class="form-group">
                                    <label>Eslogan / Tagline Logo</label>
                                    <input type="text" id="cfg-taller-tagline" value="${ws.logoTagline || ''}" placeholder="Ej: Mantenimiento de Flotas" required style="padding:0.6rem;">
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width:fit-content; align-self:flex-end;"><i class="fa-solid fa-circle-check"></i> Guardar Datos del Taller</button>
                        </form>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                    <div class="glass-card" id="card-roles-permisos">
                        <h3 style="margin-bottom:0.75rem;"><i class="fa-solid fa-user-shield"></i> Gestión de Roles y Permisos</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1.25rem;">
                            Personaliza los accesos a las diferentes vistas de la plataforma para cada rol. Los cambios se aplicarán de inmediato.
                        </p>
                        
                        <div class="form-group" style="margin-bottom:1.25rem;">
                            <label style="font-weight:600; margin-bottom:0.4rem; display:block;">Seleccionar Rol</label>
                            <select id="permiso-rol-selector" style="padding:0.6rem; width:100%; border-radius:6px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary);">
                                <!-- Options populated dynamically -->
                            </select>
                        </div>

                        <label style="font-weight:600; margin-bottom:0.6rem; display:block;">Vistas y Módulos Autorizados</label>
                        <div id="permisos-checkboxes-container" style="display:flex; flex-direction:column; gap:0.6rem; max-height:280px; overflow-y:auto; padding-right:0.4rem; margin-bottom:1.25rem; border:1px solid rgba(255,255,255,0.05); padding:0.6rem; border-radius:6px; background:rgba(0,0,0,0.1);">
                            <!-- Checkboxes populated dynamically -->
                        </div>

                        <button type="button" class="btn btn-primary" id="btn-save-role-permissions" style="width:100%; justify-content:center;">
                            <i class="fa-solid fa-circle-check"></i> Guardar Permisos del Rol
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function getEmpleadosHtml() {
        return `
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3>Catálogo de Técnicos / Empleados</h3>
                    <button class="btn btn-primary" id="btn-add-tecnico" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-user-plus"></i> Nuevo Empleado</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Especialidad</th>
                                <th>Salario Base</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.tecnicos.map(t => `
                                <tr>
                                    <td><strong>${t.Nombre_Completo}</strong></td>
                                    <td>${t.Especialidad || 'Mecánico General'}</td>
                                    <td>$ ${parseFloat(t.Salario_Base).toFixed(2)}</td>
                                    <td>
                                        <div style="display:flex; gap:0.35rem;">
                                            <button class="btn btn-secondary btn-payroll" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-calculator"></i> Planilla</button>
                                            <button class="btn btn-secondary btn-expediente" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-folder-open"></i> Expediente</button>
                                            <button class="btn btn-secondary btn-edit-tecnico" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                                            <button class="btn btn-secondary btn-delete-tecnico" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function getProductosHtml() {
        return `
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3>Catálogo de Repuestos y Productos</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">Administra el catálogo maestro de repuestos para presupuestos y POS.</p>
                    </div>
                    <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="search-productos-input" placeholder="Buscar por descripción o código..." style="padding:0.6rem 1rem; width:280px; border-radius:6px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary);">
                        <button class="btn btn-primary" id="btn-add-producto"><i class="fa-solid fa-plus"></i> Nuevo Producto</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Presentación</th>
                                <th style="text-align:right;">Precio Neto</th>
                                <th style="text-align:right;">Precio c/IVA</th>
                                <th style="text-align:center;">Stock Mín.</th>
                                <th style="text-align:center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="productos-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function getServiciosHtml() {
        return `
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3>Catálogo de Servicios y Mano de Obra</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">Define los servicios técnicos base y sus tarifas por defecto.</p>
                    </div>
                    <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="search-servicios-input" placeholder="Buscar por descripción o código..." style="padding:0.6rem 1rem; width:280px; border-radius:6px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary);">
                        <button class="btn btn-primary" id="btn-add-servicio"><i class="fa-solid fa-plus"></i> Nuevo Servicio</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Servicio</th>
                                <th>Descripción</th>
                                <th>Categoría</th>
                                <th>U. Medida</th>
                                <th style="text-align:right;">Precio Base</th>
                                <th style="text-align:center;">Precio Editable</th>
                                <th style="text-align:center;">Aplica IVA</th>
                                <th style="text-align:center;">Estado</th>
                                <th style="text-align:center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="servicios-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Render outer structure
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
            <div class="saas-tabs-container" style="margin-bottom: 0.5rem;">
                <button class="saas-tab-btn ${activeConfigTab === 'taller' ? 'active' : ''}" data-tab="taller"><i class="fa-solid fa-sliders"></i> Taller y Roles</button>
                <button class="saas-tab-btn ${activeConfigTab === 'empleados' ? 'active' : ''}" data-tab="empleados"><i class="fa-solid fa-users-gear"></i> Empleados</button>
                <button class="saas-tab-btn ${activeConfigTab === 'productos' ? 'active' : ''}" data-tab="productos"><i class="fa-solid fa-boxes-stacked"></i> Repuestos / Productos</button>
                <button class="saas-tab-btn ${activeConfigTab === 'servicios' ? 'active' : ''}" data-tab="servicios"><i class="fa-solid fa-screwdriver-wrench"></i> Servicios / Mano de Obra</button>
            </div>
            
            <div id="config-tab-content-area">
                <!-- Tab specific HTML goes here -->
            </div>
        </div>

        <!-- Payroll Modal -->
        <div id="payroll-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Cálculo de Planilla (Leyes de El Salvador)</h2>
                    <button class="close-modal-btn" id="close-payroll-modal">&times;</button>
                </div>
                <div id="payroll-content">
                    <!-- Dynamic calculation -->
                </div>
            </div>
        </div>

        <!-- Expediente Modal -->
        <div id="expediente-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Expediente Laboral</h2>
                    <button class="close-modal-btn" id="close-expediente-modal">&times;</button>
                </div>
                <div id="expediente-content">
                    <!-- Dynamic content -->
                </div>
            </div>
        </div>

        <!-- Tecnico Modal -->
        <div id="tecnico-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 id="tecnico-modal-title">Registrar Empleado</h2>
                    <button class="close-modal-btn" id="close-tecnico-modal">&times;</button>
                </div>
                <form id="tecnico-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="tecnico-id">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="tecnico-nombre" required placeholder="Nombre y Apellido">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="tecnico-email" required placeholder="ejemplo@correo.com">
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="text" id="tecnico-telefono" required placeholder="7000-0000">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Especialidad</label>
                            <input type="text" id="tecnico-especialidad" placeholder="Mecánico, Electricista, etc.">
                        </div>
                        <div class="form-group">
                            <label>Nivel de Acceso</label>
                            <select id="tecnico-acceso">
                                <option value="Técnico">Técnico</option>
                                <option value="Recepcionista">Recepcionista</option>
                                <option value="Administrador">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Salario Base ($)</label>
                            <input type="number" id="tecnico-salario" required min="365" step="1" value="365">
                        </div>
                        <div class="form-group">
                            <label>Contraseña Acceso</label>
                            <input type="password" id="tecnico-pass" required value="1234">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-tecnico">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Producto Modal -->
        <div id="producto-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 id="producto-modal-title">Registrar Producto / Repuesto</h2>
                    <button class="close-modal-btn" id="close-producto-modal">&times;</button>
                </div>
                <form id="producto-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="producto-id">
                    <div class="form-group">
                        <label>Descripción / Nombre del Repuesto</label>
                        <input type="text" id="producto-descripcion" required placeholder="Ej. Balatas delanteras">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Precio Venta ($ Sin IVA)</label>
                            <input type="number" id="producto-precio-venta" required min="0" step="0.01" value="0.00">
                        </div>
                        <div class="form-group">
                            <label>Precio Venta con IVA (13% Auto)</label>
                            <input type="text" id="producto-precio-iva" readonly style="background:rgba(255,255,255,0.05); color:var(--text-muted); padding:0.6rem; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Stock Mínimo</label>
                            <input type="number" id="producto-minimos" required min="0" step="1" value="1">
                        </div>
                        <div class="form-group">
                            <label>Presentación / Tipo Unidad</label>
                            <input type="text" id="producto-presentacion" required value="Unidad" placeholder="Ej. Unidad, Galón, Litro">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-producto">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Servicio Modal -->
        <div id="servicio-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 id="servicio-modal-title">Registrar Servicio / Mano de Obra</h2>
                    <button class="close-modal-btn" id="close-servicio-modal">&times;</button>
                </div>
                <form id="servicio-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="servicio-id">
                    <div class="form-group">
                        <label>Descripción del Servicio</label>
                        <input type="text" id="servicio-descripcion" required placeholder="Ej. Cambio de Aceite">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Precio Unitario ($ Sin IVA)</label>
                            <input type="number" id="servicio-precio" required min="0" step="0.01" value="0.00">
                        </div>
                        <div class="form-group">
                            <label>Unidad de Medida</label>
                            <select id="servicio-unidad" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="Servicio">Servicio</option>
                                <option value="Hora">Hora</option>
                                <option value="Día">Día</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="servicio-categoria" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="MO001">Mecánica General</option>
                                <option value="MO002">Electricidad</option>
                                <option value="MO003">Enderezado y Pintura</option>
                                <option value="MO004">Otros Servicios</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Precio Editable en Presupuestos?</label>
                            <select id="servicio-editable" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Aplica IVA?</label>
                            <select id="servicio-iva" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Estado</label>
                            <select id="servicio-estado" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-servicio">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Modal Close Triggers
    document.getElementById('close-payroll-modal').addEventListener('click', () => {
        document.getElementById('payroll-modal').classList.remove('active');
    });
    document.getElementById('close-expediente-modal').addEventListener('click', () => {
        document.getElementById('expediente-modal').classList.remove('active');
    });

    // Setup active tab listeners
    const tabContentArea = document.getElementById('config-tab-content-area');
    
    // Bind tabs switcher
    container.querySelectorAll('.saas-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeConfigTab = btn.getAttribute('data-tab');
            renderConfiguracion(container);
        });
    });

    // Populate Tab Content
    if (activeConfigTab === 'taller') {
        tabContentArea.innerHTML = getTallerHtml();
        
        // Bind Taller Form
        const configTallerForm = document.getElementById('config-taller-form');
        if (configTallerForm) {
            configTallerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                db.config_taller = {
                    nombre: document.getElementById('cfg-taller-nombre').value,
                    giro: document.getElementById('cfg-taller-giro').value,
                    direccion: document.getElementById('cfg-taller-direccion').value,
                    telefono: document.getElementById('cfg-taller-telefono').value,
                    correo: document.getElementById('cfg-taller-correo').value,
                    nit: document.getElementById('cfg-taller-nit').value,
                    nrc: document.getElementById('cfg-taller-nrc').value,
                    logoText: document.getElementById('cfg-taller-logotext').value,
                    logoTagline: document.getElementById('cfg-taller-tagline').value
                };
                saveDatabase(db);
                showToast("Datos de la empresa y branding de documentos actualizados", "success");
                updateSidebarBrand();
                renderConfiguracion(container);
            });
        }

        // Roles & Permisos Logic
        const rolSelector = document.getElementById('permiso-rol-selector');
        const checkboxesContainer = document.getElementById('permisos-checkboxes-container');
        const btnSavePermissions = document.getElementById('btn-save-role-permissions');

        const appViewsConfig = [
            { route: 'taller-dashboard', label: 'Panel Taller', icon: 'fa-solid fa-gauge-high' },
            { route: 'clientes-vehiculos', label: 'Clientes y Autos', icon: 'fa-solid fa-users-gear' },
            { route: 'revision-21', label: 'Hoja 21 Puntos', icon: 'fa-solid fa-clipboard-check' },
            { route: 'presupuestos', label: 'Presupuestos', icon: 'fa-solid fa-file-invoice-dollar' },
            { route: 'kanban', label: 'Control Taller (Kanban)', icon: 'fa-solid fa-cubes-stacked' },
            { route: 'facturador', label: 'Facturar DTE', icon: 'fa-solid fa-wallet' },
            { route: 'venta-rapida', label: 'Venta Rápida (POS)', icon: 'fa-solid fa-cart-shopping' },
            { route: 'cuentas-cobrar', label: 'Cuentas por Cobrar', icon: 'fa-solid fa-hand-holding-dollar' },
            { route: 'inventario', label: 'Inventario / Kárdex', icon: 'fa-solid fa-boxes-stacked' },
            { route: 'gastos', label: 'Gastos y Compras', icon: 'fa-solid fa-receipt' },
            { route: 'planilla', label: 'Planillas y Salarios', icon: 'fa-solid fa-calculator' },
            { route: 'dashboard-bi', label: 'Dashboard BI', icon: 'fa-solid fa-chart-line' },
            { route: 'configuracion', label: 'Ajustes / Catálogos', icon: 'fa-solid fa-sliders' }
        ];

        if (rolSelector && checkboxesContainer && btnSavePermissions) {
            const uniqueRoles = Array.from(new Set([
                'Administrador',
                'Técnico',
                'Recepcionista',
                ...(db.tecnicos || []).map(t => t.Nivel_Acceso).filter(Boolean)
            ]));

            rolSelector.innerHTML = uniqueRoles.map(r => `<option value="${r}">${r}</option>`).join('');

            const renderCheckboxes = (role) => {
                let allowed = [];
                if (db.role_permissions && db.role_permissions[role]) {
                    allowed = db.role_permissions[role];
                } else {
                    if (role === "Administrador") {
                        allowed = appViewsConfig.map(v => v.route);
                    } else if (role === "Recepcionista") {
                        allowed = ["taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban", "venta-rapida", "cuentas-cobrar"];
                    } else {
                        allowed = ["taller-dashboard", "clientes-vehiculos", "revision-21", "kanban"];
                    }
                }

                checkboxesContainer.innerHTML = appViewsConfig.map(view => {
                    const isChecked = allowed.includes(view.route) ? 'checked' : '';
                    const isForcedAdminSetting = (role === 'Administrador' && view.route === 'configuracion') ? 'disabled checked' : '';
                    return `
                        <div class="permission-item" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="${view.icon}" style="color: var(--primary); width: 20px; text-align: center;"></i>
                                <div>
                                    <span style="font-weight: 500; font-size: 0.85rem; color:var(--text-primary);">${view.label}</span>
                                    <small style="display: block; color: var(--text-muted); font-size: 0.7rem;">${view.route}</small>
                                </div>
                            </div>
                            <input type="checkbox" class="permission-checkbox" data-route="${view.route}" ${isChecked} ${isForcedAdminSetting} style="width: 20px; height: 20px; cursor: pointer;">
                        </div>
                    `;
                }).join('');
            };

            const initialRole = rolSelector.value;
            if (initialRole) renderCheckboxes(initialRole);

            rolSelector.addEventListener('change', (e) => {
                renderCheckboxes(e.target.value);
            });

            btnSavePermissions.addEventListener('click', () => {
                const currentDb = getDatabase();
                const selectedRole = rolSelector.value;
                const checkboxes = checkboxesContainer.querySelectorAll('.permission-checkbox');
                const selectedRoutes = [];
                
                checkboxes.forEach(cb => {
                    if (cb.checked) {
                        selectedRoutes.push(cb.getAttribute('data-route'));
                    }
                });

                if (selectedRole === 'Administrador') {
                    if (!selectedRoutes.includes('configuracion')) selectedRoutes.push('configuracion');
                    if (!selectedRoutes.includes('taller-dashboard')) selectedRoutes.push('taller-dashboard');
                }

                currentDb.role_permissions = currentDb.role_permissions || {};
                currentDb.role_permissions[selectedRole] = selectedRoutes;
                saveDatabase(currentDb);
                showToast(`Permisos para el rol "${selectedRole}" guardados y sincronizados.`, "success");
                
                updateUserUI();

                const activeUser = getActiveUser();
                if (activeUser && (activeUser.Nivel_Acceso || "Mecánico") === selectedRole) {
                    const hash = window.location.hash.substring(1);
                    let currentRoute = hash.split('?')[0] || 'taller-dashboard';
                    if (!selectedRoutes.includes(currentRoute)) {
                        const fallback = selectedRoutes.includes('taller-dashboard') ? 'taller-dashboard' : (selectedRoutes[0] || 'taller-dashboard');
                        window.location.hash = fallback;
                    }
                }
            });
        }
    } else if (activeConfigTab === 'empleados') {
        tabContentArea.innerHTML = getEmpleadosHtml();

        // Bind Payroll & Expediente buttons
        document.querySelectorAll('.btn-payroll').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const t = db.tecnicos.find(x => x.Tecnico_ID === id);
                const sumBonos = (t.Bonos || []).reduce((sum, b) => sum + parseFloat(b.Monto || 0), 0);
                openPayrollCalculation(t, sumBonos);
            });
        });

        document.querySelectorAll('.btn-expediente').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const t = db.tecnicos.find(x => x.Tecnico_ID === id);
                openExpedienteModal(t);
            });
        });

        // Edit Employee button
        document.querySelectorAll('.btn-edit-tecnico').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const t = db.tecnicos.find(x => x.Tecnico_ID === id);
                if (t) {
                    document.getElementById('tecnico-modal-title').textContent = 'Editar Empleado';
                    document.getElementById('tecnico-id').value = t.Tecnico_ID;
                    document.getElementById('tecnico-nombre').value = t.Nombre_Completo || '';
                    document.getElementById('tecnico-email').value = t.Email || '';
                    document.getElementById('tecnico-telefono').value = t.Telefono || '';
                    document.getElementById('tecnico-especialidad').value = t.Especialidad || 'Mecánico General';
                    document.getElementById('tecnico-acceso').value = t.Nivel_Acceso || 'Técnico';
                    document.getElementById('tecnico-salario').value = t.Salario_Base || 365;
                    document.getElementById('tecnico-pass').value = t.Contraseña || '1234';
                    document.getElementById('tecnico-modal').classList.add('active');
                }
            });
        });

        // Delete Employee button
        document.querySelectorAll('.btn-delete-tecnico').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const activeUser = getActiveUser();
                if (activeUser && activeUser.Tecnico_ID === id) {
                    showToast("No puedes eliminar al usuario activo", "warning");
                    return;
                }
                if (confirm("¿Está seguro de que desea eliminar a este empleado del catálogo?")) {
                    const currentDb = getDatabase();
                    currentDb.tecnicos = currentDb.tecnicos.filter(x => x.Tecnico_ID !== id);
                    saveDatabase(currentDb);
                    showToast("Empleado eliminado del catálogo", "success");
                    renderConfiguracion(container);
                }
            });
        });

        // Add Employee button
        document.getElementById('btn-add-tecnico').addEventListener('click', () => {
            document.getElementById('tecnico-modal-title').textContent = 'Registrar Empleado';
            document.getElementById('tecnico-id').value = '';
            document.getElementById('tecnico-nombre').value = '';
            document.getElementById('tecnico-email').value = '';
            document.getElementById('tecnico-telefono').value = '';
            document.getElementById('tecnico-especialidad').value = 'Mecánico General';
            document.getElementById('tecnico-acceso').value = 'Técnico';
            document.getElementById('tecnico-salario').value = '365';
            document.getElementById('tecnico-pass').value = '1234';
            document.getElementById('tecnico-modal').classList.add('active');
        });

        // Bind Employee Form Submit
        const tecnicoForm = document.getElementById('tecnico-form');
        tecnicoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('tecnico-id').value;
            const nombre = document.getElementById('tecnico-nombre').value;
            const email = document.getElementById('tecnico-email').value;
            const telefono = document.getElementById('tecnico-telefono').value;
            const especialidad = document.getElementById('tecnico-especialidad').value;
            const acceso = document.getElementById('tecnico-acceso').value;
            const salario = parseFloat(document.getElementById('tecnico-salario').value || 365);
            const pass = document.getElementById('tecnico-pass').value;
            
            const currentDb = getDatabase();
            if (id) {
                const t = currentDb.tecnicos.find(x => x.Tecnico_ID === id);
                if (t) {
                    t.Nombre_Completo = nombre;
                    t.Email = email;
                    t.Telefono = telefono;
                    t.Especialidad = especialidad;
                    t.Nivel_Acceso = acceso;
                    t.Salario_Base = salario;
                    t.Contraseña = pass;
                }
                showToast("Datos de empleado actualizados", "success");
            } else {
                const newId = `TEC-CS-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100000 + Math.random() * 900000)}`;
                currentDb.tecnicos.push({
                    Tecnico_ID: newId,
                    Nombre_Completo: nombre,
                    Email: email,
                    Telefono: telefono,
                    Especialidad: especialidad,
                    Nivel_Acceso: acceso,
                    Salario_Base: salario,
                    Contraseña: pass,
                    Incapacidades: [],
                    Vacaciones: [],
                    Bonos: []
                });
                showToast("Nuevo empleado registrado con éxito", "success");
            }
            saveDatabase(currentDb);
            document.getElementById('tecnico-modal').classList.remove('active');
            renderConfiguracion(container);
        });

        // Bind Cancel and Close triggers for employee modal
        const closeTecnicoModal = () => {
            document.getElementById('tecnico-modal').classList.remove('active');
        };
        document.getElementById('close-tecnico-modal').addEventListener('click', closeTecnicoModal);
        document.getElementById('btn-cancel-tecnico').addEventListener('click', closeTecnicoModal);

    } else if (activeConfigTab === 'productos') {
        tabContentArea.innerHTML = getProductosHtml();
        const tableBody = document.getElementById('productos-table-body');
        const searchInput = document.getElementById('search-productos-input');

        function populateProductos(filterText = '') {
            tableBody.innerHTML = '';
            const filtered = db.productos.filter(p => 
                (p.Descripcion || '').toLowerCase().includes(filterText.toLowerCase()) ||
                (p['ID_ Producto'] || '').toLowerCase().includes(filterText.toLowerCase())
            );

            // Display top 50 matches for performance
            const limit = filtered.slice(0, 50);

            if (limit.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No se encontraron productos o repuestos</td></tr>`;
                return;
            }

            limit.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><small style="color:var(--text-muted); font-family:monospace;">${p['ID_ Producto']}</small></td>
                    <td><strong>${p.Descripcion}</strong></td>
                    <td>${p.Presentacion || 'Unidad'}</td>
                    <td style="text-align:right;">$ ${parseFloat(p['Precio Venta'] || 0).toFixed(2)}</td>
                    <td style="text-align:right; color:var(--cyan);">$ ${parseFloat(p['Precio Venta Unit Iva Inc'] || (p['Precio Venta'] * 1.13) || 0).toFixed(2)}</td>
                    <td style="text-align:center;">${p.Minimos || 1}</td>
                    <td style="text-align:center;">
                        <div style="display:flex; gap:0.35rem; justify-content:center;">
                            <button class="btn btn-secondary btn-edit-producto" data-id="${p['ID_ Producto']}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-secondary btn-delete-producto" data-id="${p['ID_ Producto']}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Bind edits
            tableBody.querySelectorAll('.btn-edit-producto').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const p = db.productos.find(x => x['ID_ Producto'] === id);
                    if (p) {
                        document.getElementById('producto-modal-title').textContent = 'Editar Producto / Repuesto';
                        document.getElementById('producto-id').value = p['ID_ Producto'];
                        document.getElementById('producto-descripcion').value = p.Descripcion || '';
                        document.getElementById('producto-precio-venta').value = p['Precio Venta'] || 0;
                        document.getElementById('producto-minimos').value = p.Minimos || 1;
                        document.getElementById('producto-presentacion').value = p.Presentacion || 'Unidad';
                        
                        // Set Iva Inc
                        document.getElementById('producto-precio-iva').value = '$ ' + parseFloat((p['Precio Venta'] || 0) * 1.13).toFixed(2);
                        
                        document.getElementById('producto-modal').classList.add('active');
                    }
                });
            });

            // Bind deletes
            tableBody.querySelectorAll('.btn-delete-producto').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm(`¿Está seguro de que desea eliminar el producto "${id}" del catálogo?`)) {
                        const currentDb = getDatabase();
                        currentDb.productos = currentDb.productos.filter(x => x['ID_ Producto'] !== id);
                        saveDatabase(currentDb);
                        showToast("Producto eliminado del catálogo", "success");
                        renderConfiguracion(container);
                    }
                });
            });
        }

        // Init table
        populateProductos();

        // Search listener
        searchInput.addEventListener('input', (e) => {
            populateProductos(e.target.value);
        });

        // Add Product Trigger
        document.getElementById('btn-add-producto').addEventListener('click', () => {
            document.getElementById('producto-modal-title').textContent = 'Registrar Producto / Repuesto';
            document.getElementById('producto-id').value = '';
            document.getElementById('producto-descripcion').value = '';
            document.getElementById('producto-precio-venta').value = '0.00';
            document.getElementById('producto-minimos').value = '1';
            document.getElementById('producto-presentacion').value = 'Unidad';
            document.getElementById('producto-precio-iva').value = '$ 0.00';
            document.getElementById('producto-modal').classList.add('active');
        });

        // Auto-calculate IVA in modal
        const valInput = document.getElementById('producto-precio-venta');
        const ivaInput = document.getElementById('producto-precio-iva');
        valInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value || 0);
            ivaInput.value = '$ ' + parseFloat(val * 1.13).toFixed(2);
        });

        // Bind Submit
        const prodForm = document.getElementById('producto-form');
        prodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('producto-id').value;
            const desc = document.getElementById('producto-descripcion').value;
            const precio = parseFloat(document.getElementById('producto-precio-venta').value || 0);
            const minimos = parseInt(document.getElementById('producto-minimos').value || 1);
            const pres = document.getElementById('producto-presentacion').value || 'Unidad';

            const currentDb = getDatabase();
            if (id) {
                // Edit
                const p = currentDb.productos.find(x => x['ID_ Producto'] === id);
                if (p) {
                    p.Descripcion = desc;
                    p['Precio Venta'] = precio;
                    p['Precio Unit'] = precio;
                    p['Precio Venta Unit Iva Inc'] = parseFloat((precio * 1.13).toFixed(2));
                    p['Precio Unit Iva Inc'] = parseFloat((precio * 1.13).toFixed(2));
                    p.Minimos = minimos;
                    p.Presentacion = pres;
                }
                showToast("Producto actualizado en catálogo", "success");
            } else {
                // Add
                const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                const hhmmss = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
                const newId = `PROD-CS-${yymmdd}-${hhmmss}`;
                currentDb.productos.push({
                    "ID_ Producto": newId,
                    "Descripcion": desc,
                    "Precio Venta": precio,
                    "Precio Unit": precio,
                    "Precio Venta Unit Iva Inc": parseFloat((precio * 1.13).toFixed(2)),
                    "Precio Unit Iva Inc": parseFloat((precio * 1.13).toFixed(2)),
                    "Minimos": minimos,
                    "Presentacion": pres,
                    "Categoría": "100101",
                    "Margen": 0,
                    "Descuento": "NO",
                    "Usuario": getActiveUser() ? getActiveUser().Tecnico_ID : ''
                });
                showToast("Nuevo producto registrado con éxito", "success");
            }
            saveDatabase(currentDb);
            document.getElementById('producto-modal').classList.remove('active');
            renderConfiguracion(container);
        });

        // Close triggers
        const closeProdModal = () => {
            document.getElementById('producto-modal').classList.remove('active');
        };
        document.getElementById('close-producto-modal').addEventListener('click', closeProdModal);
        document.getElementById('btn-cancel-producto').addEventListener('click', closeProdModal);

    } else if (activeConfigTab === 'servicios') {
        tabContentArea.innerHTML = getServiciosHtml();
        const tableBody = document.getElementById('servicios-table-body');
        const searchInput = document.getElementById('search-servicios-input');

        function populateServicios(filterText = '') {
            tableBody.innerHTML = '';
            const filtered = db.mano_obra.filter(mo => 
                (mo.Descripcion || '').toLowerCase().includes(filterText.toLowerCase()) ||
                (mo.ID_ManoObra || '').toString().includes(filterText)
            );

            if (filtered.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No se encontraron servicios de mano de obra</td></tr>`;
                return;
            }

            filtered.forEach(mo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><small style="color:var(--text-muted); font-family:monospace;">${mo.ID_ManoObra}</small></td>
                    <td><strong>${mo.Descripcion}</strong></td>
                    <td>${mo.Categoria || 'MO001'}</td>
                    <td>${mo.UnidadMedida || 'Servicio'}</td>
                    <td style="text-align:right;">$ ${parseFloat(mo.PrecioUnitario || 0).toFixed(2)}</td>
                    <td style="text-align:center;"><span class="badge ${mo.PrecioEditable === 'NO' ? 'badge-danger' : 'badge-success'}">${mo.PrecioEditable || 'SI'}</span></td>
                    <td style="text-align:center;"><span class="badge ${mo.AplicaIVA === 'NO' ? 'badge-danger' : 'badge-success'}">${mo.AplicaIVA || 'SI'}</span></td>
                    <td style="text-align:center;"><span class="badge ${mo.Estado === 'Inactivo' ? 'badge-danger' : 'badge-success'}">${mo.Estado || 'Activo'}</span></td>
                    <td style="text-align:center;">
                        <div style="display:flex; gap:0.35rem; justify-content:center;">
                            <button class="btn btn-secondary btn-edit-servicio" data-id="${mo.ID_ManoObra}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-secondary btn-delete-servicio" data-id="${mo.ID_ManoObra}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Bind edits
            tableBody.querySelectorAll('.btn-edit-servicio').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const mo = db.mano_obra.find(x => x.ID_ManoObra.toString() === id.toString());
                    if (mo) {
                        document.getElementById('servicio-modal-title').textContent = 'Editar Servicio / Mano de Obra';
                        document.getElementById('servicio-id').value = mo.ID_ManoObra;
                        document.getElementById('servicio-descripcion').value = mo.Descripcion || '';
                        document.getElementById('servicio-precio').value = mo.PrecioUnitario || 0;
                        document.getElementById('servicio-unidad').value = mo.UnidadMedida || 'Servicio';
                        document.getElementById('servicio-categoria').value = mo.Categoria || 'MO001';
                        document.getElementById('servicio-editable').value = mo.PrecioEditable || 'SI';
                        document.getElementById('servicio-iva').value = mo.AplicaIVA || 'SI';
                        document.getElementById('servicio-estado').value = mo.Estado || 'Activo';
                        
                        document.getElementById('servicio-modal').classList.add('active');
                    }
                });
            });

            // Bind deletes
            tableBody.querySelectorAll('.btn-delete-servicio').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm(`¿Está seguro de que desea eliminar el servicio "${id}" del catálogo?`)) {
                        const currentDb = getDatabase();
                        currentDb.mano_obra = currentDb.mano_obra.filter(x => x.ID_ManoObra.toString() !== id.toString());
                        saveDatabase(currentDb);
                        showToast("Servicio de mano de obra eliminado", "success");
                        renderConfiguracion(container);
                    }
                });
            });
        }

        // Init table
        populateServicios();

        // Search listener
        searchInput.addEventListener('input', (e) => {
            populateServicios(e.target.value);
        });

        // Add Servicio Trigger
        document.getElementById('btn-add-servicio').addEventListener('click', () => {
            document.getElementById('servicio-modal-title').textContent = 'Registrar Servicio / Mano de Obra';
            document.getElementById('servicio-id').value = '';
            document.getElementById('servicio-descripcion').value = '';
            document.getElementById('servicio-precio').value = '0.00';
            document.getElementById('servicio-unidad').value = 'Servicio';
            document.getElementById('servicio-categoria').value = 'MO001';
            document.getElementById('servicio-editable').value = 'SI';
            document.getElementById('servicio-iva').value = 'SI';
            document.getElementById('servicio-estado').value = 'Activo';
            document.getElementById('servicio-modal').classList.add('active');
        });

        // Bind Submit
        const servForm = document.getElementById('servicio-form');
        servForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('servicio-id').value;
            const desc = document.getElementById('servicio-descripcion').value;
            const precio = parseFloat(document.getElementById('servicio-precio').value || 0);
            const unidad = document.getElementById('servicio-unidad').value;
            const cat = document.getElementById('servicio-categoria').value;
            const editable = document.getElementById('servicio-editable').value;
            const iva = document.getElementById('servicio-iva').value;
            const estado = document.getElementById('servicio-estado').value;

            const currentDb = getDatabase();
            if (id) {
                // Edit
                const mo = currentDb.mano_obra.find(x => x.ID_ManoObra.toString() === id.toString());
                if (mo) {
                    mo.Descripcion = desc;
                    mo.PrecioUnitario = precio;
                    mo.UnidadMedida = unidad;
                    mo.Categoria = cat;
                    mo.PrecioEditable = editable;
                    mo.AplicaIVA = iva;
                    mo.Estado = estado;
                }
                showToast("Servicio de mano de obra actualizado", "success");
            } else {
                // Add
                const nextId = currentDb.mano_obra.length > 0 ? Math.max(...currentDb.mano_obra.map(x => parseInt(x.ID_ManoObra) || 0)) + 1 : 320001;
                currentDb.mano_obra.push({
                    "ID_ManoObra": nextId,
                    "Descripcion": desc,
                    "PrecioUnitario": precio,
                    "UnidadMedida": unidad,
                    "Categoria": cat,
                    "PrecioEditable": editable,
                    "AplicaIVA": iva,
                    "Estado": estado,
                    "FechaCreacion": Date.now() / (1000 * 60 * 60 * 24) + 25569
                });
                showToast("Nuevo servicio de mano de obra registrado", "success");
            }
            saveDatabase(currentDb);
            document.getElementById('servicio-modal').classList.remove('active');
            renderConfiguracion(container);
        });

        // Close triggers
        const closeServModal = () => {
            document.getElementById('servicio-modal').classList.remove('active');
        };
        document.getElementById('close-servicio-modal').addEventListener('click', closeServModal);
        document.getElementById('btn-cancel-servicio').addEventListener('click', closeServModal);
    }

    // Expediente (Vacaciones, Incapacidades, Bonos) modal logic
    function openExpedienteModal(tech) {
        const modal = document.getElementById('expediente-modal');
        const content = document.getElementById('expediente-content');
        
        let activeTab = 'incapacidades';
        
        function renderExpedienteTabs() {
            let listHTML = '';
            let formHTML = '';
            
            if (activeTab === 'incapacidades') {
                listHTML = (tech.Incapacidades || []).length === 0
                    ? '<p style="color:var(--text-muted); font-size:0.85rem; padding:1rem 0; text-align:center;">No hay incapacidades registradas</p>'
                    : `<table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:0.5rem;">
                        <thead><tr style="background-color:var(--bg-input);"><th style="padding:0.5rem;">Inicio</th><th style="padding:0.5rem;">Fin</th><th style="padding:0.5rem;">Días</th><th style="padding:0.5rem;">Diagnóstico</th><th style="padding:0.5rem;">Ref. ISSS</th></tr></thead>
                        <tbody>
                            ${tech.Incapacidades.map(inc => {
                                const diff = Math.ceil((new Date(inc.Fin) - new Date(inc.Inicio)) / (1000 * 60 * 60 * 24)) + 1;
                                return `<tr><td style="padding:0.5rem;">${inc.Inicio}</td><td style="padding:0.5rem;">${inc.Fin}</td><td style="padding:0.5rem;">${diff} días</td><td style="padding:0.5rem;">${inc.Diagnostico}</td><td style="padding:0.5rem;">${inc.RefISSS || 'N/A'}</td></tr>`;
                            }).join('')}
                        </tbody>
                       </table>`;
                       
                formHTML = `
                    <form id="expediente-form-add" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                        <h4 style="color:var(--primary);">Registrar Incapacidad Médica</h4>
                        <div class="form-row">
                            <div class="form-group"><label>Fecha Inicio</label><input type="date" id="exp-inc-start" required></div>
                            <div class="form-group"><label>Fecha Fin</label><input type="date" id="exp-inc-end" required></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Diagnóstico / Motivo</label><input type="text" id="exp-inc-diag" placeholder="Ej. Accidente, Gripe..." required></div>
                            <div class="form-group"><label>Número de Licencia ISSS</label><input type="text" id="exp-inc-ref" placeholder="Certificado #"></div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:fit-content; align-self:flex-end;"><i class="fa-solid fa-save"></i> Registrar Incapacidad</button>
                    </form>
                `;
            } else if (activeTab === 'vacaciones') {
                listHTML = (tech.Vacaciones || []).length === 0
                    ? '<p style="color:var(--text-muted); font-size:0.85rem; padding:1rem 0; text-align:center;">No hay vacaciones registradas</p>'
                    : `<table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:0.5rem;">
                        <thead><tr style="background-color:var(--bg-input);"><th style="padding:0.5rem;">Inicio</th><th style="padding:0.5rem;">Fin</th><th style="padding:0.5rem;">Días</th><th style="padding:0.5rem;">Detalles</th></tr></thead>
                        <tbody>
                            ${tech.Vacaciones.map(v => {
                                const diff = Math.ceil((new Date(v.Fin) - new Date(v.Inicio)) / (1000 * 60 * 60 * 24)) + 1;
                                return `<tr><td style="padding:0.5rem;">${v.Inicio}</td><td style="padding:0.5rem;">${v.Fin}</td><td style="padding:0.5rem;">${diff} días</td><td style="padding:0.5rem;">${v.Detalles || 'Períero regular'}</td></tr>`;
                            }).join('')}
                        </tbody>
                       </table>`;
                       
                formHTML = `
                    <form id="expediente-form-add" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                        <h4 style="color:var(--primary);">Registrar Vacaciones Tomadas</h4>
                        <div class="form-row">
                            <div class="form-group"><label>Fecha Inicio</label><input type="date" id="exp-vac-start" required></div>
                            <div class="form-group"><label>Fecha Fin</label><input type="date" id="exp-vac-end" required></div>
                        </div>
                        <div class="form-group"><label>Comentarios / Prima Vacacional (30%)</label><input type="text" id="exp-vac-notes" placeholder="Ej. Con prima 30% cancelada..."></div>
                        <button type="submit" class="btn btn-primary" style="width:fit-content; align-self:flex-end;"><i class="fa-solid fa-save"></i> Registrar Vacación</button>
                    </form>
                `;
            } else {
                listHTML = (tech.Bonos || []).length === 0
                    ? '<p style="color:var(--text-muted); font-size:0.85rem; padding:1rem 0; text-align:center;">No hay bonos o extras registrados</p>'
                    : `<table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:0.5rem;">
                        <thead><tr style="background-color:var(--bg-input);"><th style="padding:0.5rem;">Fecha</th><th style="padding:0.5rem;">Monto</th><th style="padding:0.5rem;">Concepto</th></tr></thead>
                        <tbody>
                            ${tech.Bonos.map(b => `<tr><td style="padding:0.5rem;">${new Date(b.Fecha).toLocaleDateString('es-SV')}</td><td style="padding:0.5rem; font-weight:700; color:var(--cyan);">$ ${parseFloat(b.Monto).toFixed(2)}</td><td style="padding:0.5rem;">${b.Concepto}</td></tr>`).join('')}
                        </tbody>
                       </table>`;
                       
                formHTML = `
                    <form id="expediente-form-add" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                        <h4 style="color:var(--primary);">Registrar Extra / Bono / Comisión</h4>
                        <div class="form-row">
                            <div class="form-group"><label>Monto del Pago Extra ($)</label><input type="number" id="exp-bon-monto" min="0.01" step="0.01" required></div>
                            <div class="form-group"><label>Concepto del Pago</label><input type="text" id="exp-bon-concepto" placeholder="Ej. Comisión por labor, Bono trimestral" required></div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:fit-content; align-self:flex-end;"><i class="fa-solid fa-save"></i> Registrar Pago Extra</button>
                    </form>
                `;
            }
            
            content.innerHTML = `
                <div style="margin-top:1rem; display:flex; flex-direction:column; gap:1rem;">
                    <div>
                        <strong style="font-size:1.15rem; color:var(--cyan);">${tech.Nombre_Completo}</strong>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">Historial Laboral del Taller</p>
                    </div>
                    
                    <div style="display:flex; border-bottom:1px solid var(--border-color); gap:0.5rem; padding-bottom:0.25rem;">
                        <button class="btn ${activeTab === 'incapacidades' ? 'btn-primary' : 'btn-secondary'}" id="tab-inc" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-bed-pulse"></i> Incapacidades</button>
                        <button class="btn ${activeTab === 'vacaciones' ? 'btn-primary' : 'btn-secondary'}" id="tab-vac" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-umbrella-beach"></i> Vacaciones</button>
                        <button class="btn ${activeTab === 'bonos' ? 'btn-primary' : 'btn-secondary'}" id="tab-bon" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-hand-holding-dollar"></i> Bonos y Extras</button>
                    </div>
                    
                    <div class="table-container" style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
                        ${listHTML}
                    </div>
                    
                    ${formHTML}
                </div>
            `;
            
            document.getElementById('tab-inc').addEventListener('click', () => { activeTab = 'incapacidades'; renderExpedienteTabs(); });
            document.getElementById('tab-vac').addEventListener('click', () => { activeTab = 'vacaciones'; renderExpedienteTabs(); });
            document.getElementById('tab-bon').addEventListener('click', () => { activeTab = 'bonos'; renderExpedienteTabs(); });
            
            const formAdd = document.getElementById('expediente-form-add');
            if (formAdd) {
                formAdd.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    if (activeTab === 'incapacidades') {
                        const start = document.getElementById('exp-inc-start').value;
                        const end = document.getElementById('exp-inc-end').value;
                        const diag = document.getElementById('exp-inc-diag').value;
                        const ref = document.getElementById('exp-inc-ref').value;
                        
                        tech.Incapacidades.unshift({ Inicio: start, Fin: end, Diagnostico: diag, RefISSS: ref });
                        showToast("Incapacidad registrada en expediente", "success");
                    } else if (activeTab === 'vacaciones') {
                        const start = document.getElementById('exp-vac-start').value;
                        const end = document.getElementById('exp-vac-end').value;
                        const notes = document.getElementById('exp-vac-notes').value;
                        
                        tech.Vacaciones.unshift({ Inicio: start, Fin: end, Detalles: notes });
                        showToast("Vacaciones registradas en expediente", "success");
                    } else {
                        const amt = parseFloat(document.getElementById('exp-bon-monto').value);
                        const conc = document.getElementById('exp-bon-concepto').value;
                        
                        tech.Bonos.unshift({ Fecha: Date.now(), Monto: amt, Concepto: conc });
                        showToast("Bono/Comisión extra registrado", "success");
                    }
                    
                    saveDatabase(db);
                    renderExpedienteTabs();
                });
            }
        }
        
        renderExpedienteTabs();
        modal.classList.add('active');
    }

    function openPayrollCalculation(tech, initialBonos = 0) {
        const payrollContent = document.getElementById('payroll-content');
        
        function updateCalcView(sal, bonos) {
            const calc = calculateElSalvadorPeriodPayroll(sal, bonos, 'M');
            payrollContent.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:1.25rem; margin-top:1rem;">
                    <div>
                        <strong style="font-size:1.1rem; color:var(--primary);">${tech.Nombre_Completo}</strong>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">${tech.Especialidad || 'Mecánico'} • ${tech.Nivel_Acceso}</p>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Salario Base ($)</label>
                            <input type="number" id="calc-salario-base" value="${sal}" step="50" min="365">
                        </div>
                        <div class="form-group">
                            <label>Bonos / Extras / Comisiones ($)</label>
                            <input type="number" id="calc-bonos" value="${bonos}" step="10" min="0">
                        </div>
                    </div>
                    
                    <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
                        <h4 style="margin-bottom:0.75rem; color:var(--text-secondary);">Deducciones de Ley (Empleado)</h4>
                        <table style="width:100%; font-size:0.85rem; border:none; margin-bottom:1rem;">
                            <tr style="border:none;"><td style="padding:0.35rem 0; border:none;">Ingresos Totales:</td><td style="text-align:right; font-weight:600; border:none;">$ ${calc.totalGravado.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.35rem 0; border:none;">ISSS Seguro Social (3.0%):</td><td style="text-align:right; color:var(--danger); border:none;">- $ ${calc.isssEmployee.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.35rem 0; border:none;">AFP Pensiones (7.25%):</td><td style="text-align:right; color:var(--danger); border:none;">- $ ${calc.afpEmployee.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.35rem 0; border:none;">Impuesto Renta Retención (ISR):</td><td style="text-align:right; color:var(--danger); border:none;">- $ ${calc.isr.toFixed(2)}</td></tr>
                            <tr style="border:none; font-weight:bold; font-size:1rem; border-top:1px solid var(--border-color);"><td style="padding:0.5rem 0; border:none;">Salario Neto a Recibir:</td><td style="text-align:right; color:var(--success); border:none;">$ ${calc.netSalary.toFixed(2)}</td></tr>
                        </table>
                    </div>
                    
                    <div style="border-top:1px solid var(--border-color); padding-top:1rem; background-color:rgba(255,255,255,0.01); padding:1rem; border-radius:var(--radius-md);">
                        <h4 style="margin-bottom:0.5rem; color:var(--text-secondary);">Aportaciones Patronales (Costo Taller)</h4>
                        <table style="width:100%; font-size:0.85rem; border:none; margin-bottom:0.5rem;">
                            <tr style="border:none;"><td style="padding:0.25rem 0; border:none;">ISSS Patronal (7.50%):</td><td style="text-align:right; border:none;">$ ${calc.isssEmployer.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.25rem 0; border:none;">AFP Patronal (8.75%):</td><td style="text-align:right; border:none;">$ ${calc.afpEmployer.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.25rem 0; border:none;">INSAFORP (1.00%):</td><td style="text-align:right; border:none;">$ ${calc.insaforp.toFixed(2)}</td></tr>
                            <tr style="border:none; font-weight:bold; border-top:1px solid var(--border-color);"><td style="padding:0.5rem 0; border:none;">Costo Mensual Total:</td><td style="text-align:right; color:var(--cyan); border:none;">$ ${calc.employerCost.toFixed(2)}</td></tr>
                        </table>
                    </div>
                    
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                        <button class="btn btn-secondary" id="btn-calc-close">Cerrar</button>
                        <button class="btn btn-primary" id="btn-calc-save-sal"><i class="fa-solid fa-floppy-disk"></i> Guardar Salario Base</button>
                    </div>
                </div>
            `;
            
            document.getElementById('calc-salario-base').addEventListener('change', (e) => {
                const s = parseFloat(e.target.value || 0);
                updateCalcView(s, parseFloat(document.getElementById('calc-bonos').value || 0));
            });
            document.getElementById('calc-bonos').addEventListener('change', (e) => {
                const b = parseFloat(e.target.value || 0);
                updateCalcView(parseFloat(document.getElementById('calc-salario-base').value || 0), b);
            });
            
            document.getElementById('btn-calc-close').addEventListener('click', () => {
                document.getElementById('payroll-modal').classList.remove('active');
            });
            
            document.getElementById('btn-calc-save-sal').addEventListener('click', () => {
                const s = parseFloat(document.getElementById('calc-salario-base').value || 0);
                tech.Salario_Base = s;
                saveDatabase(db);
                showToast("Salario base actualizado para planilla", "success");
                document.getElementById('payroll-modal').classList.remove('active');
                renderConfiguracion(container);
            });
        }
        
        updateCalcView(tech.Salario_Base, initialBonos);
        document.getElementById('payroll-modal').classList.add('active');
    }
}

// ----------------------------------------------------
// PLANILLAS Y SALARIOS (LEYES DE EL SALVADOR)
// ----------------------------------------------------

function calculateElSalvadorPeriodPayroll(baseSalary, extraEarnings = 0, periodType = 'M') {
    // Si es quincenal, el salario base se divide entre 2 para el período
    const currentBase = periodType === 'M' ? baseSalary : baseSalary / 2;
    const totalGravado = currentBase + extraEarnings;
    
    // Topes de ISSS según período
    const isssLimit = periodType === 'M' ? 1000 : 500;
    
    const isssEmployee = Math.min(totalGravado, isssLimit) * 0.03;
    const afpEmployee = totalGravado * 0.0725;
    
    const rentBase = totalGravado - isssEmployee - afpEmployee;
    let isr = 0;
    
    if (periodType === 'M') {
        // ISR Mensual
        if (rentBase > 2038.10) {
            isr = (rentBase - 2038.10) * 0.30 + 288.57;
        } else if (rentBase > 895.24) {
            isr = (rentBase - 895.24) * 0.20 + 60.00;
        } else if (rentBase > 472.00) {
            isr = (rentBase - 472.00) * 0.10 + 17.67;
        }
    } else {
        // ISR Quincenal
        if (rentBase > 1019.05) {
            isr = (rentBase - 1019.05) * 0.30 + 144.28;
        } else if (rentBase > 447.62) {
            isr = (rentBase - 447.62) * 0.20 + 30.00;
        } else if (rentBase > 236.00) {
            isr = (rentBase - 236.00) * 0.10 + 8.83;
        }
    }
    
    const totalDeductions = isssEmployee + afpEmployee + isr;
    const netSalary = totalGravado - totalDeductions;
    
    const isssEmployer = Math.min(totalGravado, isssLimit) * 0.075;
    const afpEmployer = totalGravado * 0.0875;
    const insaforpLimit = periodType === 'M' ? 1000 : 500;
    const insaforp = totalGravado >= insaforpLimit ? totalGravado * 0.01 : 0;
    const employerCost = totalGravado + isssEmployer + afpEmployer + insaforp;
    
    return {
        totalGravado,
        isssEmployee,
        afpEmployee,
        isr,
        totalDeductions,
        netSalary,
        isssEmployer,
        afpEmployer,
        insaforp,
        employerCost
    };
}

function renderPlanilla(container, queryParams) {
    const db = getDatabase();
    
    // Inicializar colecciones de planillas en DB si faltan
    if (!db.novedades_planilla) db.novedades_planilla = [];
    if (!db.planillas_cerradas) db.planillas_cerradas = [];
    
    // Variables de estado del filtro local
    let currentYear = 2026;
    let currentMonth = 6;
    let currentPeriod = '1Q'; // '1Q', '2Q', 'M'
    
    function renderView() {
        const key = `${currentYear}-${currentMonth}-${currentPeriod}`;
        const isClosed = db.planillas_cerradas.some(pc => pc.key === key);
        
        // Cargar datos del histórico si está cerrado, de lo contrario calcular en vivo
        let payrollList = [];
        if (isClosed) {
            const historyObj = db.planillas_cerradas.find(pc => pc.key === key);
            payrollList = historyObj.data;
        } else {
            payrollList = db.tecnicos.map(t => {
                if (t.Salario_Base === undefined) {
                    t.Salario_Base = t.Tecnico_ID.includes('181025') ? 1200 : 750;
                }
                
                // Obtener o crear novedades del período
                let nov = db.novedades_planilla.find(n => n.techId === t.Tecnico_ID && n.year === currentYear && n.month === currentMonth && n.period === currentPeriod);
                if (!nov) {
                    nov = {
                        techId: t.Tecnico_ID,
                        year: currentYear,
                        month: currentMonth,
                        period: currentPeriod,
                        horasExtras: 0,
                        pgr: 0,
                        prestamos: 0,
                        anticipos: 0,
                        comisiones: 0,
                        primaVacacional: 0,
                        descuentosOtros: 0
                    };
                    db.novedades_planilla.push(nov);
                }
                
                const extraEarnings = parseFloat(nov.horasExtras || 0) + parseFloat(nov.comisiones || 0) + parseFloat(nov.primaVacacional || 0);
                const calc = calculateElSalvadorPeriodPayroll(t.Salario_Base, extraEarnings, currentPeriod);
                
                const totalDescuentosAdicionales = parseFloat(nov.pgr || 0) + parseFloat(nov.prestamos || 0) + parseFloat(nov.anticipos || 0) + parseFloat(nov.descuentosOtros || 0);
                const netoFinal = calc.netSalary - totalDescuentosAdicionales;
                
                return {
                    Tecnico_ID: t.Tecnico_ID,
                    Nombre_Completo: t.Nombre_Completo,
                    Especialidad: t.Especialidad || 'Técnico',
                    Salario_Base: t.Salario_Base,
                    Salario_Periodo_Base: currentPeriod === 'M' ? t.Salario_Base : t.Salario_Base / 2,
                    horasExtras: nov.horasExtras,
                    comisiones: nov.comisiones,
                    primaVacacional: nov.primaVacacional,
                    extraEarnings,
                    pgr: nov.pgr,
                    prestamos: nov.prestamos,
                    anticipos: nov.anticipos,
                    descuentosOtros: nov.descuentosOtros,
                    totalDescuentosAdicionales,
                    isssEmployee: calc.isssEmployee,
                    afpEmployee: calc.afpEmployee,
                    isr: calc.isr,
                    netSalary: netoFinal,
                    isssEmployer: calc.isssEmployer,
                    afpEmployer: calc.afpEmployer,
                    insaforp: calc.insaforp,
                    employerCost: calc.employerCost
                };
            });
        }
        
        // Calcular Totales de Planilla
        const totals = payrollList.reduce((sum, item) => {
            sum.gross += item.Salario_Periodo_Base + item.extraEarnings;
            sum.deductions += item.isssEmployee + item.afpEmployee + item.isr + item.totalDescuentosAdicionales;
            sum.net += item.netSalary;
            sum.employerCost += item.employerCost;
            return sum;
        }, { gross: 0, deductions: 0, net: 0, employerCost: 0 });
        
        container.innerHTML = `
            <div class="glass-card" style="margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                    <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Año</label>
                            <select id="pl-year" style="padding:0.4rem 0.6rem; min-width:80px;">
                                <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                                <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                                <option value="2027" ${currentYear === 2027 ? 'selected' : ''}>2027</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Mes</label>
                            <select id="pl-month" style="padding:0.4rem 0.6rem; min-width:110px;">
                                <option value="1" ${currentMonth === 1 ? 'selected' : ''}>Enero</option>
                                <option value="2" ${currentMonth === 2 ? 'selected' : ''}>Febrero</option>
                                <option value="3" ${currentMonth === 3 ? 'selected' : ''}>Marzo</option>
                                <option value="4" ${currentMonth === 4 ? 'selected' : ''}>Abril</option>
                                <option value="5" ${currentMonth === 5 ? 'selected' : ''}>Mayo</option>
                                <option value="6" ${currentMonth === 6 ? 'selected' : ''}>Junio</option>
                                <option value="7" ${currentMonth === 7 ? 'selected' : ''}>Julio</option>
                                <option value="8" ${currentMonth === 8 ? 'selected' : ''}>Agosto</option>
                                <option value="9" ${currentMonth === 9 ? 'selected' : ''}>Septiembre</option>
                                <option value="10" ${currentMonth === 10 ? 'selected' : ''}>Octubre</option>
                                <option value="11" ${currentMonth === 11 ? 'selected' : ''}>Noviembre</option>
                                <option value="12" ${currentMonth === 12 ? 'selected' : ''}>Diciembre</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Período Planilla</label>
                            <select id="pl-period" style="padding:0.4rem 0.6rem; min-width:130px;">
                                <option value="1Q" ${currentPeriod === '1Q' ? 'selected' : ''}>1ª Quincena (1-15)</option>
                                <option value="2Q" ${currentPeriod === '2Q' ? 'selected' : ''}>2ª Quincena (16-Fin)</option>
                                <option value="M" ${currentPeriod === 'M' ? 'selected' : ''}>Mensual Completo</option>
                            </select>
                        </div>
                        
                        <div style="margin-top:1.1rem;">
                            ${isClosed 
                                ? '<span class="badge-tag badge-success" style="padding: 0.5rem 0.75rem;"><i class="fa-solid fa-lock"></i> Planilla Cerrada e Historial Guardado</span>' 
                                : '<span class="badge-tag badge-warning" style="padding: 0.5rem 0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Período Abierto (Editable)</span>'}
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:0.5rem; margin-top:1.1rem;">
                        <button class="btn btn-secondary" id="btn-export-consolidated-planilla"><i class="fa-solid fa-print"></i> Exportar Hoja</button>
                        ${isClosed 
                            ? `<button class="btn btn-secondary" id="btn-reopen-planilla" style="color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-lock-open"></i> Reabrir</button>` 
                            : `<button class="btn btn-primary" id="btn-lock-planilla"><i class="fa-solid fa-lock"></i> Cerrar Período</button>`}
                    </div>
                </div>
            </div>
            
            <div class="dashboard-stats" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom:1.5rem;">
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Ingresos / Devengado Total</span>
                        <span class="stat-value">$ ${totals.gross.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--primary); background-color:var(--primary-glow);"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Retenciones Totales</span>
                        <span class="stat-value" style="color:var(--danger);">$ ${totals.deductions.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--danger); background-color:var(--danger-glow);"><i class="fa-solid fa-minus"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Salarios Líquidos Netos</span>
                        <span class="stat-value" style="color:var(--success);">$ ${totals.net.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--success); background-color:var(--success-glow);"><i class="fa-solid fa-wallet"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Costo Total Nómina Taller</span>
                        <span class="stat-value" style="color:var(--cyan);">$ ${totals.employerCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--cyan); background-color:rgba(6,182,212,0.1);"><i class="fa-solid fa-building-columns"></i></div>
                </div>
            </div>
            
            <div class="glass-card">
                <h3>Resumen de Planilla General</h3>
                <div class="table-container" style="margin-top:1rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Base Período</th>
                                <th>Ingresos Extras</th>
                                <th>Retenciones de Ley</th>
                                <th>Otros Descuentos</th>
                                <th>Neto a Pagar</th>
                                <th>Costo Patronal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payrollList.map(item => `
                                <tr>
                                    <td>
                                        <strong>${item.Nombre_Completo}</strong>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">${item.Especialidad}</div>
                                    </td>
                                    <td>$ ${parseFloat(item.Salario_Periodo_Base).toFixed(2)}</td>
                                    <td style="color:var(--success);">+ $ ${parseFloat(item.extraEarnings).toFixed(2)}</td>
                                    <td style="color:var(--danger);">- $ ${(item.isssEmployee + item.afpEmployee + item.isr).toFixed(2)}
                                        <div style="font-size:0.7rem; color:var(--text-muted);">ISSS: $${item.isssEmployee.toFixed(2)} | AFP: $${item.afpEmployee.toFixed(2)} | ISR: $${item.isr.toFixed(2)}</div>
                                    </td>
                                    <td style="color:var(--danger);">- $ ${parseFloat(item.totalDescuentosAdicionales).toFixed(2)}</td>
                                    <td style="font-weight:700; color:var(--success);">$ ${parseFloat(item.netSalary).toFixed(2)}</td>
                                    <td style="color:var(--cyan); font-weight:600;">$ ${parseFloat(item.employerCost).toFixed(2)}</td>
                                    <td>
                                        <div style="display:flex; gap:0.35rem;">
                                            <button class="btn btn-secondary btn-payroll-novedades" data-id="${item.Tecnico_ID}" ${isClosed ? 'disabled style="opacity:0.5;"' : ''} style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Novedades</button>
                                            <button class="btn btn-secondary btn-payroll-boleta" data-id="${item.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-file-invoice"></i> Boleta</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Novedades Modal -->
            <div id="novedades-periodo-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Registrar Ajustes de Planilla</h2>
                        <button class="close-modal-btn" id="close-nov-modal">&times;</button>
                    </div>
                    <form id="novedades-periodo-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                        <input type="hidden" id="nov-tech-id">
                        <div style="font-size:0.9rem; color:var(--primary); font-weight:bold;" id="nov-empleado-name"></div>
                        <div class="form-row">
                            <div class="form-group"><label>Horas Extras ($)</label><input type="number" id="nov-horas-extras" step="0.01" min="0"></div>
                            <div class="form-group"><label>Comisiones / Bonos ($)</label><input type="number" id="nov-comisiones" step="0.01" min="0"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Prima Vacacional (30% Ley)</label><input type="number" id="nov-vacaciones" step="0.01" min="0"></div>
                            <div class="form-group"><label>Anticipo de Salario ($)</label><input type="number" id="nov-anticipos" step="0.01" min="0"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Préstamos Recurrentes ($)</label><input type="number" id="nov-prestamos" step="0.01" min="0"></div>
                            <div class="form-group"><label>Cuota Alimenticia PGR ($)</label><input type="number" id="nov-pgr" step="0.01" min="0"></div>
                        </div>
                        <div class="form-group">
                            <label>Otros Descuentos / Sanciones ($)</label>
                            <input type="number" id="nov-otros" step="0.01" min="0">
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-nov">Cancelar</button>
                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Boleta Print Modal -->
            <div id="boleta-print-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>Vista de Boleta de Pago</h2>
                        <button class="close-modal-btn" id="close-boleta-modal">&times;</button>
                    </div>
                    <div id="boleta-receipt-content" style="background-color: white; color: black; padding: 2rem; border-radius: 4px; font-family: monospace;">
                        <!-- Content rendered dynamically -->
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                        <button type="button" class="btn btn-secondary" id="btn-close-boleta">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="btn-print-boleta-action"><i class="fa-solid fa-print"></i> Imprimir Boleta</button>
                    </div>
                </div>
            </div>
        `;
        
        // Bind Filter events
        document.getElementById('pl-year').addEventListener('change', (e) => { currentYear = parseInt(e.target.value); renderView(); });
        document.getElementById('pl-month').addEventListener('change', (e) => { currentMonth = parseInt(e.target.value); renderView(); });
        document.getElementById('pl-period').addEventListener('change', (e) => { currentPeriod = e.target.value; renderView(); });
        
        // Bind lock/close button
        const lockBtn = document.getElementById('btn-lock-planilla');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                if (confirm(`¿Está seguro de que desea CERRAR el período de planilla para ${currentPeriod} de ${document.getElementById('pl-month').options[currentMonth-1].text} ${currentYear}?\nEsto bloqueará el registro de novedades.`)) {
                    db.planillas_cerradas.push({
                        key,
                        year: currentYear,
                        month: currentMonth,
                        period: currentPeriod,
                        closedAt: Date.now(),
                        data: payrollList
                    });
                    saveDatabase(db);
                    showToast("Planilla cerrada y guardada en el historial contable", "success");
                    renderView();
                }
            });
        }
        
        // Bind reopen button
        const reopenBtn = document.getElementById('btn-reopen-planilla');
        if (reopenBtn) {
            reopenBtn.addEventListener('click', () => {
                if (confirm(`¿Reabrir planilla del período? Volverá a ser editable.`)) {
                    db.planillas_cerradas = db.planillas_cerradas.filter(pc => pc.key !== key);
                    saveDatabase(db);
                    showToast("Planilla reabierta para edición", "info");
                    renderView();
                }
            });
        }
        
        // Bind Export Consolidated Planilla
        document.getElementById('btn-export-consolidated-planilla').addEventListener('click', () => {
            exportPlanillaConsolidada(currentYear, currentMonth, currentPeriod, payrollList);
        });

        // Bind Novedades Click
        document.querySelectorAll('.btn-payroll-novedades').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const emp = payrollList.find(x => x.Tecnico_ID === id);
                
                document.getElementById('nov-tech-id').value = id;
                document.getElementById('nov-empleado-name').textContent = emp.Nombre_Completo;
                
                document.getElementById('nov-horas-extras').value = emp.horasExtras || 0;
                document.getElementById('nov-comisiones').value = emp.comisiones || 0;
                document.getElementById('nov-vacaciones').value = emp.primaVacacional || 0;
                document.getElementById('nov-anticipos').value = emp.anticipos || 0;
                document.getElementById('nov-prestamos').value = emp.prestamos || 0;
                document.getElementById('nov-pgr').value = emp.pgr || 0;
                document.getElementById('nov-otros').value = emp.descuentosOtros || 0;
                
                document.getElementById('novedades-periodo-modal').classList.add('active');
            });
        });
        
        // Save Novedades Form
        const novForm = document.getElementById('novedades-periodo-form');
        novForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('nov-tech-id').value;
            const hExtras = parseFloat(document.getElementById('nov-horas-extras').value || 0);
            const com = parseFloat(document.getElementById('nov-comisiones').value || 0);
            const vac = parseFloat(document.getElementById('nov-vacaciones').value || 0);
            const ant = parseFloat(document.getElementById('nov-anticipos').value || 0);
            const pres = parseFloat(document.getElementById('nov-prestamos').value || 0);
            const pgr = parseFloat(document.getElementById('nov-pgr').value || 0);
            const otros = parseFloat(document.getElementById('nov-otros').value || 0);
            
            // Buscar o crear novedad en el array persistente
            let nov = db.novedades_planilla.find(n => n.techId === id && n.year === currentYear && n.month === currentMonth && n.period === currentPeriod);
            if (!nov) {
                nov = { techId: id, year: currentYear, month: currentMonth, period: currentPeriod };
                db.novedades_planilla.push(nov);
            }
            
            nov.horasExtras = hExtras;
            nov.comisiones = com;
            nov.primaVacacional = vac;
            nov.anticipos = ant;
            nov.prestamos = pres;
            nov.pgr = pgr;
            nov.descuentosOtros = otros;
            
            saveDatabase(db);
            showToast("Ajustes del período guardados", "success");
            document.getElementById('novedades-periodo-modal').classList.remove('active');
            renderView();
        });
        
        // Close modal triggers
        const closeNov = () => document.getElementById('novedades-periodo-modal').classList.remove('active');
        document.getElementById('close-nov-modal').addEventListener('click', closeNov);
        document.getElementById('btn-cancel-nov').addEventListener('click', closeNov);
        
        // Bind Boleta Click
        document.querySelectorAll('.btn-payroll-boleta').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const emp = payrollList.find(x => x.Tecnico_ID === id);
                
                const ws = getWorkshopConfig(db);
                const periodStr = currentPeriod === 'M' ? 'Mensual' : (currentPeriod === '1Q' ? '1ª Quincena' : '2ª Quincena');
                const monthName = document.getElementById('pl-month').options[currentMonth-1].text;
                
                const recContent = document.getElementById('boleta-receipt-content');
                recContent.innerHTML = `
                    <div style="text-align:center; margin-bottom:1rem; border-bottom:1.5px dashed #000; padding-bottom:0.75rem;">
                        <h2 style="margin:0; font-size:1.4rem; font-weight:800; font-family:'Outfit', sans-serif;">${ws.nombre}</h2>
                        <div style="font-size:0.75rem; margin-top:0.25rem;">${ws.giro}</div>
                        <div style="font-size:0.85rem; font-weight:bold; margin-top:0.5rem; text-transform:uppercase;">Boleta de Pago de Salarios</div>
                        <div style="font-size:0.8rem; margin-top:0.25rem; font-weight:600;">Período: ${periodStr} de ${monthName} de ${currentYear}</div>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:1rem; line-height:1.4;">
                        <div>
                            <strong>Empleado:</strong> ${emp.Nombre_Completo}<br>
                            <strong>Cargo:</strong> ${emp.Especialidad}<br>
                            <strong>ID:</strong> ${emp.Tecnico_ID}
                        </div>
                        <div style="text-align:right;">
                            <strong>Salario Base:</strong> $ ${parseFloat(emp.Salario_Base).toFixed(2)}/mes<br>
                            <strong>Base Período:</strong> $ ${parseFloat(itemBaseSalary(emp)).toFixed(2)}
                        </div>
                    </div>
                    
                    <table style="width:100%; font-size:0.8rem; border-collapse:collapse; margin-bottom:1.25rem;">
                        <thead>
                            <tr style="border-bottom:1px solid #000; font-weight:bold;">
                                <th style="text-align:left; padding:0.25rem 0;">Ingresos / Devengos</th>
                                <th style="text-align:right; padding:0.25rem 0;">Monto</th>
                                <th style="text-align:left; padding:0.25rem 0; padding-left:1rem;">Deducciones / Descuentos</th>
                                <th style="text-align:right; padding:0.25rem 0;">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding:0.2rem 0;">Base del Período</td>
                                <td style="text-align:right;">$ ${parseFloat(itemBaseSalary(emp)).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">ISSS Seguro Social (3%)</td>
                                <td style="text-align:right; color:red;">- $ ${emp.isssEmployee.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Horas Extras</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.horasExtras || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">AFP Pensiones (7.25%)</td>
                                <td style="text-align:right; color:red;">- $ ${emp.afpEmployee.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Comisiones / Bonos</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.comisiones || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Retención ISR Renta</td>
                                <td style="text-align:right; color:red;">- $ ${emp.isr.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Prima Vacacional</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.primaVacacional || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Anticipos de Salario</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.anticipos || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Préstamos Taller</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.prestamos || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Cuota Alimenticia PGR</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.pgr || 0).toFixed(2)}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #000;">
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem; padding-bottom:0.25rem;">Otros Descuentos</td>
                                <td style="text-align:right; color:red; padding-bottom:0.25rem;">- $ ${parseFloat(emp.descuentosOtros || 0).toFixed(2)}</td>
                            </tr>
                            <tr style="font-weight:bold;">
                                <td style="padding:0.5rem 0;">Total Devengado</td>
                                <td style="text-align:right;">$ ${(itemBaseSalary(emp) + emp.extraEarnings).toFixed(2)}</td>
                                <td style="padding:0.5rem 0; padding-left:1rem;">Total Retenciones</td>
                                <td style="text-align:right;">$ ${(emp.isssEmployee + emp.afpEmployee + emp.isr + emp.totalDescuentosAdicionales).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="background-color:#f1f5f9; padding:0.75rem; display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:1rem; border:1px solid #000;">
                        <span>LÍQUIDO NETO A RECIBIR:</span>
                        <span style="color:#047857;">$ ${parseFloat(emp.netSalary).toFixed(2)}</span>
                    </div>
                    
                    <div style="margin-top:2.5rem; display:flex; justify-content:space-between; font-size:0.7rem;">
                        <div style="width:45%; border-top:1px solid #000; text-align:center; padding-top:0.25rem;">
                            Firma del Empleado<br>DUI: _________________
                        </div>
                        <div style="width:45%; border-top:1px solid #000; text-align:center; padding-top:0.25rem;">
                            Entregado Por (Taller / Caja)<br>${ws.nombre}
                        </div>
                    </div>
                `;
                
                document.getElementById('boleta-print-modal').classList.add('active');
                
                // Bind print action button inside modal
                document.getElementById('btn-print-boleta-action').replaceWith(document.getElementById('btn-print-boleta-action').cloneNode(true));
                document.getElementById('btn-print-boleta-action').addEventListener('click', () => {
                    const printWin = window.open('', '_blank');
                    printWin.document.write(`
                        <html>
                        <head>
                            <title>Boleta de Pago - ${emp.Nombre_Completo}</title>
                            <style>
                                body { font-family: monospace; padding: 20px; background: white; color: black; }
                                table { width: 100%; border-collapse: collapse; }
                                th, td { padding: 4px; }
                            </style>
                        </head>
                        <body>
                            <div style="max-width:600px; margin:0 auto; border:1px solid #000; padding:20px;">
                                ${recContent.innerHTML}
                            </div>
                            <script>window.print();<\/script>
                        </body>
                        </html>
                    `);
                    printWin.document.close();
                });
            });
        });
        
        function itemBaseSalary(emp) {
            return currentPeriod === 'M' ? emp.Salario_Base : emp.Salario_Base / 2;
        }

        const closeBoleta = () => document.getElementById('boleta-print-modal').classList.remove('active');
        document.getElementById('close-boleta-modal').addEventListener('click', closeBoleta);
        document.getElementById('btn-close-boleta').addEventListener('click', closeBoleta);
    }
    
    renderView();
}

function exportPlanillaConsolidada(year, month, periodType, payrollData) {
    const periodStr = periodType === 'M' ? 'Mensual' : (periodType === '1Q' ? '1ª Quincena' : '2ª Quincena');
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthStr = monthNames[month - 1];

    const totals = payrollData.reduce((sum, item) => {
        sum.base += item.Salario_Periodo_Base;
        sum.extras += item.extraEarnings;
        sum.isss += item.isssEmployee;
        sum.afp += item.afpEmployee;
        sum.isr += item.isr;
        sum.other += item.totalDescuentosAdicionales;
        sum.net += item.netSalary;
        sum.patronalISSS += item.isssEmployer;
        sum.patronalAFP += item.afpEmployer;
        sum.insaforp += item.insaforp;
        sum.totalCost += item.employerCost;
        return sum;
    }, { base: 0, extras: 0, isss: 0, afp: 0, isr: 0, other: 0, net: 0, patronalISSS: 0, patronalAFP: 0, insaforp: 0, totalCost: 0 });

    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const printWin = window.open('', '_blank');
    printWin.document.write(`
        <html>
        <head>
            <title>Planilla Consolidada - ${periodStr} ${monthStr} ${year}</title>
            <style>
                body { font-family: 'Inter', sans-serif; font-size: 11px; color: black; background: white; padding: 25px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                h1 { margin: 0; font-size: 18px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
                th { background-color: #f3f4f6; font-weight: bold; }
                .text-right { text-align: right; }
                .totals-row { font-weight: bold; background-color: #e5e7eb; }
                .footer-signatures { display: flex; justify-content: space-between; margin-top: 50px; }
                .signature-box { width: 30%; border-top: 1px solid #000; text-align: center; padding-top: 5px; font-size: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${ws.nombre}</h1>
                <div style="font-size:12px; font-weight:bold; margin-top:4px;">REPORTE DE PLANILLA CONSOLIDADA DE SALARIOS</div>
                <div style="font-size:11px; margin-top:2px;">Período: ${periodStr} de ${monthStr} de ${year}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Base Período</th>
                        <th>Ingresos Extras</th>
                        <th class="text-right">ISSS Ret.</th>
                        <th class="text-right">AFP Ret.</th>
                        <th class="text-right">ISR Renta</th>
                        <th class="text-right">Otros Descs.</th>
                        <th class="text-right">Líquido a Pagar</th>
                        <th class="text-right">Costo Patronal</th>
                    </tr>
                </thead>
                <tbody>
                    ${payrollData.map(item => `
                        <tr>
                            <td><strong>${item.Nombre_Completo}</strong><br><small style="color:#666;">${item.Especialidad}</small></td>
                            <td>$ ${parseFloat(item.Salario_Periodo_Base).toFixed(2)}</td>
                            <td>$ ${parseFloat(item.extraEarnings).toFixed(2)}</td>
                            <td class="text-right">$ ${item.isssEmployee.toFixed(2)}</td>
                            <td class="text-right">$ ${item.afpEmployee.toFixed(2)}</td>
                            <td class="text-right">$ ${item.isr.toFixed(2)}</td>
                            <td class="text-right">$ ${item.totalDescuentosAdicionales.toFixed(2)}</td>
                            <td class="text-right" style="font-weight:bold;">$ ${item.netSalary.toFixed(2)}</td>
                            <td class="text-right">$ ${item.employerCost.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    <tr class="totals-row">
                        <td>TOTALES PLANILLA</td>
                        <td>$ ${totals.base.toFixed(2)}</td>
                        <td>$ ${totals.extras.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.isss.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.afp.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.isr.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.other.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.net.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.totalCost.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top:20px; font-size:10px; background-color:#f9fafb; padding:10px; border:1px solid #e5e7eb;">
                <strong>Resumen de Aportes Patronales para este Período:</strong><br>
                ISSS Patronal (7.50%): $ ${totals.patronalISSS.toFixed(2)} | 
                AFP Patronal (8.75%): $ ${totals.patronalAFP.toFixed(2)} | 
                INSAFORP (1.00%): $ ${totals.insaforp.toFixed(2)} | 
                <strong>Total Aportes Patronales:</strong> $ ${(totals.patronalISSS + totals.patronalAFP + totals.insaforp).toFixed(2)}
            </div>

            <div class="footer-signatures">
                <div class="signature-box">
                    Preparado Por (Contabilidad)<br>${ws.nombre}
                </div>
                <div class="signature-box">
                    Revisado Por (Recursos Humanos)<br>Firma Autorizada
                </div>
                <div class="signature-box">
                    Aprobado Por (Gerencia)<br>Firma Autorizada
                </div>
            </div>
            <script>window.print();<\/script>
        </body>
        </html>
    `);
    printWin.document.close();
}

// ----------------------------------------------------
// BUDGET PDF EXPORT (GRUPO GEMA FORMAT)
// ----------------------------------------------------
function exportBudgetPDF(budgetId) {
    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const budget = db.presupuestos.find(p => p['ID Presupuesto'] === budgetId);
    if (!budget) {
        showToast("Error: Presupuesto no encontrado", "danger");
        return;
    }

    const client = db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { 
        Nombre: budget.Nombre, 
        'Telefono 1 ': budget['Telefono 1 '] || '', 
        Direccion: budget.Direccion || '' 
    };
    
    const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === budget.ID_Vehiculo) || { 
        Placas: budget.Placas || 'N/A', 
        Marca: 'N/A', 
        Modelo: 'N/A', 
        Año: 'N/A' 
    };

    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

    const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budgetId);
    const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budgetId);

    const sumProd = products.reduce((sum, p) => sum + parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1), 0);
    const sumLab = labor.reduce((sum, l) => sum + parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1), 0);
    const subtotal = sumProd + sumLab;
    const taxRate = parseFloat(budget['% Impuesto'] || 0.13);
    const iva = subtotal * taxRate;

    let retVal = 0;
    let percVal = 0;
    if (client.AplicaRetencion > 0) {
        retVal = subtotal * parseFloat(client.AplicaRetencion);
    }
    if (client.AplicaPercepcion > 0) {
        percVal = subtotal * parseFloat(client.AplicaPercepcion);
    }

    const grandTotal = subtotal + iva + percVal - retVal;

    const productsHTML = products.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">No se cotizan repuestos y lubricantes</td></tr>'
        : products.map(p => `
            <tr>
                <td style="text-align: center; width: 8%;">${p.Cantidad}</td>
                <td style="width: 62%;">${p.Descripcion}</td>
                <td style="text-align: right; width: 15%;">$ ${parseFloat(p.PrecioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; width: 15%;">$ ${(parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    const laborHTML = labor.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">No se cotiza mano de obra</td></tr>'
        : labor.map(l => `
            <tr>
                <td style="text-align: center; width: 8%;">${l.Cantidad}</td>
                <td style="width: 62%;">${l.Descripcion}</td>
                <td style="text-align: right; width: 15%;">$ ${parseFloat(l.PrecioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
                <td style="text-align: right; width: 15%;">$ ${(parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    let percRow = '';
    if (percVal > 0) {
        percRow = `
            <tr>
                <td class="totals-label">(+) IVA PERCIBIDO</td>
                <td class="totals-val">$ ${percVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let retRow = '';
    if (retVal > 0) {
        retRow = `
            <tr>
                <td class="totals-label">(-) IVA RETENIDO</td>
                <td class="totals-val">$ ${retVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Orden de Trabajo - ${budget['ID Presupuesto']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #1e293b;
            --secondary-color: #475569;
            --bg-label: #dce2e6;
            --border-color: #b0b8c0;
            --text-color: #000;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-color);
            background-color: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .no-print-toolbar {
            background-color: #1e293b;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .no-print-toolbar h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 1.15rem;
            font-weight: 600;
        }
        .toolbar-buttons {
            display: flex;
            gap: 12px;
        }
        .btn-action {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .btn-print {
            background-color: #10b981;
            color: #fff;
        }
        .btn-print:hover {
            background-color: #059669;
        }
        .btn-close {
            background-color: #64748b;
            color: #fff;
        }
        .btn-close:hover {
            background-color: #475569;
        }

        .page-container {
            width: 820px;
            margin: 30px auto;
            background-color: #fff;
            padding: 40px;
            box-sizing: border-box;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border-radius: 8px;
        }

        .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
        }
        .company-details {
            max-width: 500px;
        }
        .company-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 1.5rem;
            margin: 0 0 6px 0;
            color: var(--primary-color);
            letter-spacing: -0.02em;
        }
        .company-info {
            font-size: 0.85rem;
            line-height: 1.5;
            color: #334155;
        }
        .company-email {
            color: #0b5ed7;
            text-decoration: none;
            font-weight: 600;
        }
        .company-email:hover {
            text-decoration: underline;
        }
        .logo-container {
            width: 220px;
            text-align: right;
        }

        .document-title {
            text-align: right;
            font-family: 'Outfit', sans-serif;
            font-size: 1.25rem;
            font-weight: 500;
            color: #64748b;
            letter-spacing: 0.08em;
            margin: 10px 0 15px 0;
            text-transform: uppercase;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            margin-bottom: 20px;
        }
        table, th, td {
            border: 1px solid var(--border-color);
        }

        .meta-table td {
            padding: 6px 10px;
            vertical-align: middle;
        }
        .meta-label {
            background-color: var(--bg-label);
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.72rem;
            width: 18%;
            text-align: center;
            color: #1e293b;
        }
        .meta-val {
            background-color: #fff;
            width: 32%;
            font-size: 0.8rem;
            color: #0f172a;
        }

        .section-title-bar {
            background-color: var(--primary-color);
            color: #fff;
            text-align: center;
            font-family: 'Outfit', sans-serif;
            font-size: 0.8rem;
            font-weight: 700;
            padding: 6px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .section-desc-box {
            border: 1px solid var(--border-color);
            border-top: none;
            padding: 10px 15px;
            min-height: 40px;
            font-size: 0.85rem;
            margin-bottom: 25px;
            background-color: #fff;
            color: #1e293b;
            border-radius: 0 0 4px 4px;
        }

        .data-table th {
            background-color: var(--bg-label);
            color: #0f172a;
            font-weight: 700;
            text-align: center;
            padding: 8px;
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }
        .data-table td {
            padding: 8px 10px;
            font-size: 0.82rem;
            color: #1e293b;
        }
        .table-footer-row {
            background-color: var(--bg-label);
            font-weight: bold;
            font-size: 0.8rem;
            color: #0f172a;
        }
        .table-footer-row td {
            padding: 8px 10px;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 25px;
            page-break-inside: avoid;
        }
        .auth-box {
            width: 55%;
            border: 1.5px solid var(--border-color);
            padding: 15px;
            box-sizing: border-box;
            border-radius: 6px;
            min-height: 120px;
            font-size: 0.8rem;
            background-color: #fff;
        }
        .auth-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 30px;
            color: #0f172a;
            font-size: 0.75rem;
            letter-spacing: 0.04em;
        }
        .auth-line {
            border-bottom: 1.5px dashed var(--border-color);
            margin-top: 20px;
            width: 80%;
        }

        .totals-table {
            width: 40%;
            margin-bottom: 0;
        }
        .totals-table td {
            padding: 6px 10px;
        }
        .totals-label {
            background-color: var(--bg-label);
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.72rem;
            width: 50%;
            text-align: center;
            color: #0f172a;
        }
        .totals-val {
            text-align: right;
            font-size: 0.85rem;
            width: 50%;
            color: #1e293b;
        }
        .grand-total-row {
            font-weight: bold;
            font-size: 1rem;
        }

        @media print {
            body {
                background-color: #fff;
                color: #000;
            }
            .no-print-toolbar {
                display: none !important;
            }
            .page-container {
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border-radius: 0;
            }
            @page {
                size: portrait;
                margin: 1.2cm;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-toolbar">
        <h3>Vista Previa de Impresión - Mecanic OS</h3>
        <div class="toolbar-buttons">
            <button class="btn-action btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir o Guardar PDF</button>
            <button class="btn-action btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar Vista Previa</button>
        </div>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="pdf-header">
            <div class="company-details">
                <h1 class="company-title">${ws.nombre}</h1>
                <div class="company-info">
                    ${ws.direccion}<br>
                    Tel. ${ws.telefono}<br>
                    <a href="mailto:${ws.correo}" class="company-email">${ws.correo}</a>
                </div>
            </div>
            <div class="logo-container">
                <svg width="220" height="90" viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="218" height="88" rx="8" fill="#f8fafc" stroke="#b0b8c0" stroke-width="1.2"/>
                    <path d="M10,75 L210,75 M10,79 L210,79" stroke="#64748b" stroke-width="0.8" stroke-dasharray="2,2"/>
                    <g transform="translate(14, 16) scale(0.052)" fill="#1e293b">
                        <path d="M190 280 L160 210 Q150 190 130 190 L60 190 Q40 190 30 210 L5 280 L5 360 L190 360 Z M190 360 M120 220 L70 220 L70 260 L120 260 Z" fill="#64748b"/>
                        <circle cx="50" cy="370" r="22"/>
                        <circle cx="150" cy="370" r="22"/>
                        <path d="M420 250 L380 160 Q360 130 330 130 L230 130 Q200 130 180 160 L140 250 L140 370 L420 370 Z M280 170 L210 170 L210 220 L280 220 Z M370 170 L300 170 L300 220 L370 220 Z" fill="#1e293b"/>
                        <circle cx="210" cy="385" r="28"/>
                        <circle cx="350" cy="385" r="28"/>
                    </g>
                    <text x="76" y="24" font-family="'Outfit', sans-serif" font-size="11.5" font-weight="800" fill="#1e293b">${ws.logoText || 'TALLER'}</text>
                    <text x="76" y="37" font-family="'Outfit', sans-serif" font-size="9" font-weight="700" fill="#64748b">${ws.nombre.includes('C.V.') || ws.nombre.includes('c.v.') ? 'S.A. DE C.V.' : ''}</text>
                    <text x="76" y="55" font-family="'Inter', sans-serif" font-size="6" font-weight="600" fill="#1e293b">${(ws.logoTagline || '').toUpperCase()}</text>
                    <text x="76" y="65" font-family="'Inter', sans-serif" font-size="5.5" font-weight="600" fill="#64748b">${(ws.giro || '').substring(0, 50).toUpperCase()}</text>
                </svg>
            </div>
        </div>

        <div class="document-title">Orden de Trabajo</div>

        <!-- Meta Grid -->
        <table class="meta-table">
            <tr>
                <td class="meta-label">Cliente</td>
                <td class="meta-val">${budget.Nombre}</td>
                <td class="meta-label">Placa</td>
                <td class="meta-val">${vehicle.Placas || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Teléfono</td>
                <td class="meta-val">${budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A'}</td>
                <td class="meta-label">Condición</td>
                <td class="meta-val">${budget.Condicion || (client['Credito?'] === 'SI' ? 'CREDITO' : 'CONTADO')}</td>
            </tr>
            <tr>
                <td class="meta-label">Fecha Ingreso</td>
                <td class="meta-val">${new Date(budget.Fecha).toLocaleDateString('es-SV')}</td>
                <td class="meta-label">Fecha Prometida</td>
                <td class="meta-val">${budget['Fecha Prometida'] ? new Date(budget['Fecha Prometida']).toLocaleDateString('es-SV') : new Date(budget.Fecha + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('es-SV')}</td>
            </tr>
            <tr>
                <td class="meta-label">V I N</td>
                <td class="meta-val">${vehicle.Nª_VIN || 'N/A'}</td>
                <td class="meta-label">Marca</td>
                <td class="meta-val">${vehicle.Marca || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Odómetro</td>
                <td class="meta-val">${budget.Kilometraje || vehicle.Odometro || '0'}</td>
                <td class="meta-label">Modelo</td>
                <td class="meta-val">${vehicle.Modelo || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Motor</td>
                <td class="meta-val">${vehicle.Nª_Motor || 'N/A'}</td>
                <td class="meta-label">Año</td>
                <td class="meta-val">${vehicle.Año || 'N/A'}</td>
            </tr>
        </table>

        <!-- Fallas Detectadas Box -->
        <div class="section-title-bar">Fallas Detectadas</div>
        <div class="section-desc-box">${budget.Fallas_Detectadas || budget['Fallas Detectadas'] || 'Diagnóstico general de taller'}</div>

        <!-- Products Table -->
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-cant">Cant</th>
                    <th class="col-desc">Descripción Repuestos y Lubricantes</th>
                    <th class="col-price">P. Unitario</th>
                    <th class="col-total">Total ($)</th>
                </tr>
            </thead>
            <tbody>
                ${productsHTML}
                <tr class="table-footer-row">
                    <td colspan="3">Total Repuestos y Lubricantes</td>
                    <td style="text-align: right;">$ ${sumProd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        <!-- Labor Table -->
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-cant">Cant</th>
                    <th class="col-desc">Descripción Mano de Obra</th>
                    <th class="col-price">P. Unitario</th>
                    <th class="col-total">Total ($)</th>
                </tr>
            </thead>
            <tbody>
                ${laborHTML}
                <tr class="table-footer-row">
                    <td colspan="3">Total Mano de obra</td>
                    <td style="text-align: right;">$ ${sumLab.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        <!-- Bottom Layout -->
        <div class="bottom-section">
            <div class="auth-box">
                <div class="auth-title">Trabajos Autorizados Por:</div>
                <div style="font-weight: 500; font-size: 0.85rem; color: #334155; margin-top: 15px;">
                    ${budget.Nombre}
                </div>
                <div class="auth-line"></div>
            </div>
            
            <table class="totals-table">
                <tr>
                    <td class="totals-label">Sumas</td>
                    <td class="totals-val">$ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                    <td class="totals-label">IVA</td>
                    <td class="totals-val">$ ${iva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${percRow}
                ${retRow}
                <tr>
                    <td class="totals-label">(-) Retención Renta</td>
                    <td class="totals-val">$ 0.00</td>
                </tr>
                <tr class="grand-total-row">
                    <td class="totals-label" style="background-color: var(--primary-color); color: #fff;">Total a Pagar</td>
                    <td class="totals-val" style="font-weight: bold; font-size: 1.05rem;">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </table>
        </div>
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.print();
            }, 600);
        });
    </script>
</body>
</html>
`);
    printWindow.document.close();
}

// ----------------------------------------------------
// SAAS PORTAL & ONBOARDING VIEWS
// ----------------------------------------------------
function renderLanding(container) {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    
    if (saas.status === 'pending') {
        container.innerHTML = `
            <div class="saas-container" style="max-width: 700px; margin: 6rem auto; text-align: center; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 4rem; color: var(--warning); margin-bottom: 1.5rem;"><i class="fa-solid fa-clock-rotate-left"></i></div>
                <h2 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 700; margin-bottom: 1rem;">Solicitud Pendiente de Revisión</h2>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem; font-size: 1.05rem;">
                    Tu solicitud para registrar el taller <strong>${saas.workshopData ? saas.workshopData.nombre : 'nuevo'}</strong> está siendo evaluada por nuestro equipo de administración de Mecanic OS.<br>
                    Te notificaremos por correo electrónico una vez que tu cuenta sea aprobada.
                </p>
                <div style="display:flex; flex-direction:column; gap:1rem; align-items:center;">
                    <a href="#admin-solicitudes" class="btn btn-primary" style="padding:0.75rem 1.5rem; text-decoration:none;"><i class="fa-solid fa-user-shield"></i> Simular Consola del Admin (Aprobar Solicitud)</a>
                    <button id="btn-reset-saas-guest" class="btn btn-secondary" style="font-size:0.85rem;"><i class="fa-solid fa-rotate-left"></i> Cancelar Solicitud y Volver a Intentar</button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-reset-saas-guest').addEventListener('click', () => {
            if (confirm("¿Deseas cancelar la solicitud y volver al estado inicial?")) {
                db.saas_state = { status: 'guest', workshopData: null, termsSigned: false };
                db.solicitudes_registro = db.solicitudes_registro.filter(s => s.id !== (saas.workshopData && saas.workshopData.id));
                saveDatabase(db);
                window.location.hash = 'landing';
                handleRouting();
            }
        });
        return;
    }

    let actionButtonsHTML = '';
    let topButtonsHTML = '';
    
    if (saas.status === 'active') {
        const workshopName = saas.workshopData ? saas.workshopData.nombre : 'Mi Taller';
        topButtonsHTML = `
            <div style="display:flex; gap:0.75rem; align-items:center;">
                <a href="#taller-dashboard" style="color:var(--text-primary); text-decoration:none; font-size:0.85rem; font-weight:600; background:var(--primary); padding:0.5rem 1.2rem; border-radius:50px;"><i class="fa-solid fa-right-to-bracket"></i> Acceder</a>
                <a href="#admin-solicitudes" style="color:var(--text-secondary); text-decoration:none; font-size:0.85rem; font-weight:600; background:rgba(255,255,255,0.05); padding:0.5rem 1rem; border-radius:50px; border:1px solid var(--border-color);"><i class="fa-solid fa-user-shield"></i> Consola Admin SaaS</a>
            </div>
        `;
        
        actionButtonsHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:1.25rem; margin-top:2rem;">
                <a href="#taller-dashboard" class="btn btn-primary" style="padding:1rem 2.5rem; font-size:1.15rem; text-decoration:none; box-shadow:0 10px 20px rgba(99, 102, 241, 0.3);"><i class="fa-solid fa-right-to-bracket"></i> Ingresar a ${workshopName}</a>
                <button id="btn-landing-reset" style="background:none; border:none; color:var(--text-secondary); text-decoration:underline; font-size:0.85rem; cursor:pointer; margin-top:0.5rem;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Desconectar taller / Usar otra cuenta</button>
            </div>
        `;
    } else {
        topButtonsHTML = `
            <div style="display:flex; gap:0.75rem; align-items:center;">
                <button id="btn-landing-top-login" style="color:var(--text-primary); text-decoration:none; font-size:0.85rem; font-weight:600; background:var(--primary); border:none; padding:0.5rem 1.2rem; border-radius:50px; cursor:pointer;"><i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión</button>
                <a href="#admin-solicitudes" style="color:var(--text-secondary); text-decoration:none; font-size:0.85rem; font-weight:600; background:rgba(255,255,255,0.05); padding:0.5rem 1rem; border-radius:50px; border:1px solid var(--border-color);"><i class="fa-solid fa-user-shield"></i> Consola Admin SaaS</a>
            </div>
        `;
        
        actionButtonsHTML = `
            <div style="display:flex; justify-content:center; gap:1.25rem; flex-wrap:wrap; margin-top:2rem;">
                <a href="#registro" class="btn btn-primary" style="padding:0.9rem 2.2rem; font-size:1.1rem; text-decoration:none; box-shadow:0 10px 20px rgba(99, 102, 241, 0.3);"><i class="fa-solid fa-rocket"></i> Registrar mi Taller</a>
                <button id="btn-landing-login" class="btn btn-secondary" style="padding:0.9rem 2.2rem; font-size:1.1rem; cursor:pointer;"><i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión / Conectar Taller</button>
                <button id="btn-landing-demo" class="btn btn-secondary" style="padding:0.9rem 2.2rem; font-size:1.1rem; color:var(--cyan); border-color:var(--cyan); cursor:pointer;"><i class="fa-solid fa-desktop"></i> Probar Demo (Grupo Gema)</button>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="landing-hero" style="position:relative; overflow:hidden; padding: 6rem 2rem; text-align:center; background: radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%);">
            <div style="display:flex; justify-content:space-between; max-width:1100px; margin:-4rem auto 4rem auto; align-items:center;">
                <div class="logo" style="font-size:1.8rem; font-weight:800; font-family:'Outfit', sans-serif; color:var(--text-primary);">
                    <i class="fa-solid fa-gears logo-icon" style="color:var(--primary);"></i> Mecanic<span>OS</span>
                </div>
                ${topButtonsHTML}
            </div>
            
            <h1 style="font-family:'Outfit', sans-serif; font-size:3.5rem; font-weight:800; line-height:1.15; max-width:800px; margin: 0 auto 1.5rem auto; background: linear-gradient(135deg, #fff 30%, var(--primary-glow) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">El Sistema Operativo Premium para tu Taller Automotriz</h1>
            <p style="color:var(--text-secondary); font-size:1.2rem; max-width:650px; margin: 0 auto 2.5rem auto; line-height:1.6;">
                Mecanic OS automatiza tu taller de punta a punta: desde la recepción de vehículos con inspección digital hasta la facturación electrónica DTE (Ministerio de Hacienda) y la planilla de salarios.
            </p>
            ${actionButtonsHTML}
        </div>
        
        <div style="max-width:1100px; margin:0 auto 6rem auto; padding:0 2rem;">
            <h2 style="font-family:'Outfit', sans-serif; text-align:center; font-size:2rem; font-weight:700; margin-bottom:3rem;">Características Todo-en-Uno</h2>
            <div class="landing-features-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:2rem;">
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--primary); margin-bottom:1rem;"><i class="fa-solid fa-clipboard-check"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Recepción y Diagnóstico 21 Puntos</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Registra ingresos, kilometraje and evalúa el vehículo con un semáforo interactivo (Verde, Amarillo, Rojo) desde cualquier celular o tablet en el patio del taller.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--success); margin-bottom:1rem;"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Facturación Electrónica DTE</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Integración nativa con Hacienda de El Salvador (Facturas y Créditos Fiscales). Firma digital automática y emisión de ticket fiscal térmico.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--cyan); margin-bottom:1rem;"><i class="fa-solid fa-calculator"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Planilla y Nómina de Ley</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Cálculos exactos conforme a leyes salvadoreñas (Deducciones ISSS, AFP, ISR tramos mensuales/quincenales e INSAFORP) con boletas imprimibles.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--warning); margin-bottom:1rem;"><i class="fa-solid fa-cubes-stacked"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Control Visual de Taller (Kanban)</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Monitorea la carga laboral de tus técnicos. Arrastra y sigue el progreso de las reparaciones de los vehículos en tiempo real.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--primary); margin-bottom:1rem;"><i class="fa-solid fa-chart-pie"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">BI y Estadísticas Financieras</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Visualiza gráficos interactivos de ventas, gastos, abonos recibidos, utilidad neta e indicadores ejecutivos en tiempo real para la toma de decisiones.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--danger); margin-bottom:1rem;"><i class="fa-solid fa-users-gear"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Flotas y Expediente del Auto</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Administra datos de clientes, flota de vehículos e historial médico completo de intervenciones, servicios y repuestos instalados por auto.</p>
                </div>
            </div>
        </div>
    `;

    // Bind listeners
    const topLoginBtn = document.getElementById('btn-landing-top-login');
    if (topLoginBtn) {
        topLoginBtn.addEventListener('click', () => {
            document.getElementById('firebase-auth-modal').classList.add('active');
        });
    }

    const loginBtn = document.getElementById('btn-landing-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            document.getElementById('firebase-auth-modal').classList.add('active');
        });
    }

    const demoBtn = document.getElementById('btn-landing-demo');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            const currentDb = getDatabase();
            currentDb.saas_state = {
                status: 'active',
                workshopData: {
                    id: 'REQ-GEMA',
                    nombre: 'GRUPO GEMA, S.A. DE C.V.',
                    giro: 'Servicio de Mantenimiento al Transporte Terrestre',
                    direccion: 'Carretera al Puerto de La Libertad, Km. 10.5, Santa Tecla',
                    telefono: '2288-9900',
                    correo: 'contacto@grupogemasv.com',
                    nit: '0614-121285-101-5',
                    nrc: '190562-4',
                    logoText: 'GRUPO GEMA',
                    logoTagline: 'Transporte & Mantenimiento Especializado',
                    propietario: 'David Antonio Mejía Ramírez',
                    pass: 'admin',
                    status: 'aprobado',
                    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
                    plan: 'Enterprise',
                    precio_mensual: 120.00,
                    suscripcion_status: 'activo',
                    proximo_pago: Date.now() + 18 * 24 * 60 * 60 * 1000
                },
                termsSigned: true,
                signatureName: 'David Antonio Mejía Ramírez',
                signedAt: Date.now() - 59 * 24 * 60 * 60 * 1000
            };
            saveDatabase(currentDb);
            showToast("Modo Demo activado para Grupo Gema.", "success");
            window.location.hash = 'taller-dashboard';
            handleRouting();
        });
    }

    const resetBtn = document.getElementById('btn-landing-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("¿Seguro que deseas desconectar este taller? Se eliminarán los datos locales de esta PC y volverás al estado de Invitado.")) {
                db.saas_state = {
                    status: 'guest',
                    workshopData: null,
                    termsSigned: false,
                    signatureName: '',
                    signedAt: null
                };
                db.config_taller = null;
                db.solicitudes_registro = [];
                db.saas_payments = [];
                saveDatabase(db);
                sessionStorage.removeItem('mecanic_os_active_user');
                showToast("Taller desconectado con éxito", "info");
                window.location.hash = 'landing';
                handleRouting();
            }
        });
    }
}

function renderLockScreen(container) {
    const db = getDatabase();
    const saas = db.saas_state || {};
    const workshop = saas.workshopData || { nombre: 'Mecanic OS', logoText: 'MecanicOS', logoTagline: 'Gestión de Taller' };
    
    // Clear any previous active user just in case
    sessionStorage.removeItem('mecanic_os_active_user');

    function showProfiles() {
        container.innerHTML = `
            <div style="max-width: 800px; margin: 4rem auto; padding: 2.5rem; text-align: center;">
                <div style="margin-bottom: 3rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <div style="font-size: 3rem; color: var(--primary);"><i class="fa-solid fa-gears"></i></div>
                    <h1 style="font-family:'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; color: var(--text-primary); margin: 0;">${workshop.nombre}</h1>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">${workshop.logoTagline || 'Control de Acceso de Empleados'}</p>
                </div>
                
                <h2 style="font-family:'Outfit', sans-serif; font-size: 1.25rem; font-weight: 600; margin-bottom: 2rem; color: var(--text-primary);">Selecciona tu Perfil de Empleado</h2>
                
                <div id="lock-profiles-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; justify-content: center; max-width: 650px; margin: 0 auto;">
                    ${db.tecnicos.map(t => {
                        const avatar = t.Foto_Perfil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
                        return `
                            <div class="user-card lock-profile-card" data-id="${t.Codigo_Cliente || t.Nombre_Completo}" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: var(--radius-md); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 1rem; transition: var(--transition-fast);">
                                <img src="${avatar}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
                                <div style="text-align: center;">
                                    <strong style="font-size: 0.95rem; display: block; color: var(--text-primary);">${t.Nombre_Completo}</strong>
                                    <small style="color: var(--text-secondary); font-size: 0.75rem;">${t.Nivel_Acceso}</small>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        const cards = container.querySelectorAll('.lock-profile-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.borderColor = 'var(--primary)';
                card.style.background = 'var(--bg-card-hover)';
                card.style.transform = 'translateY(-3px)';
                card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = 'var(--border-color)';
                card.style.background = 'var(--bg-card)';
                card.style.transform = '';
                card.style.boxShadow = '';
            });
            card.addEventListener('click', () => {
                const techId = card.getAttribute('data-id');
                const selectedTech = db.tecnicos.find(t => (t.Codigo_Cliente || t.Nombre_Completo) === techId);
                if (selectedTech) {
                    showPasscodeForm(selectedTech);
                }
            });
        });
    }

    function showPasscodeForm(tech) {
        const avatar = tech.Foto_Perfil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
        container.innerHTML = `
            <div style="max-width: 450px; margin: 6rem auto; padding: 2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <img src="${avatar}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); margin-bottom: 1rem; box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);">
                    <h2 style="margin: 0; font-family:'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${tech.Nombre_Completo}</h2>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">${tech.Nivel_Acceso}</span>
                </div>
                
                <form id="lock-passcode-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <div class="form-group">
                        <label style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 500;">Contraseña de Acceso</label>
                        <input type="password" id="lock-user-password" required placeholder="Ingresa tu contraseña" style="padding: 0.75rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 6px; font-size: 1rem; margin-top: 0.4rem;">
                    </div>
                    <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-lock-back" style="flex: 1; padding: 0.75rem;"><i class="fa-solid fa-arrow-left"></i> Cambiar Perfil</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.75rem;"><i class="fa-solid fa-right-to-bracket"></i> Ingresar</button>
                    </div>
                </form>
            </div>
        `;

        setTimeout(() => {
            const input = document.getElementById('lock-user-password');
            if (input) input.focus();
        }, 100);

        document.getElementById('btn-lock-back').addEventListener('click', showProfiles);

        document.getElementById('lock-passcode-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredPass = document.getElementById('lock-user-password').value;
            const realPass = tech.Contraseña || '';
            
            if (enteredPass === realPass) {
                setActiveUser(tech);
                showToast(`Sesión iniciada como ${tech.Nombre_Completo.split(' ')[0]}`, "success");
                window.location.hash = 'taller-dashboard';
                handleRouting();
            } else {
                showToast("Contraseña de empleado incorrecta", "error");
                const pwdInput = document.getElementById('lock-user-password');
                if (pwdInput) {
                    pwdInput.value = '';
                    pwdInput.focus();
                }
            }
        });
    }

    showProfiles();
}

function renderRegistroSaaS(container) {
    container.innerHTML = `
        <div style="max-width:650px; margin:4rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                <div>
                    <h2 style="font-family:'Outfit', sans-serif; font-size:1.75rem; font-weight:700; color:var(--text-primary);">Registrar Nuevo Taller</h2>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Completa los datos comerciales para crear tu cuenta en Mecanic OS</p>
                </div>
                <a href="#landing" style="color:var(--text-secondary); text-decoration:none; font-size:0.85rem;"><i class="fa-solid fa-arrow-left"></i> Volver</a>
            </div>
            
            <form id="saas-register-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                <div class="form-group">
                    <label>Nombre Comercial del Taller</label>
                    <input type="text" id="reg-taller-nombre" required placeholder="Ej: Taller Automotriz San José" style="padding:0.6rem;">
                </div>
                
                <div class="form-group">
                    <label>Giro / Actividad Económica</label>
                    <input type="text" id="reg-taller-giro" required placeholder="Ej: Mantenimiento y Pintura Automotriz" style="padding:0.6rem;">
                </div>
                
                <div class="form-group">
                    <label>Dirección del Taller</label>
                    <input type="text" id="reg-taller-direccion" required placeholder="Calle principal, Municipio, Departamento" style="padding:0.6rem;">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Teléfono de Contacto</label>
                        <input type="text" id="reg-taller-telefono" required placeholder="2222-2222" style="padding:0.6rem;">
                    </div>
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" id="reg-taller-correo" required placeholder="contacto@taller.com" style="padding:0.6rem;">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>NIT de la Empresa</label>
                        <input type="text" id="reg-taller-nit" required placeholder="0614-xxxxxx-xxx-x" style="padding:0.6rem;">
                    </div>
                    <div class="form-group">
                        <label>NRC (Registro Contribuyente)</label>
                        <input type="text" id="reg-taller-nrc" required placeholder="xxxxxx-x" style="padding:0.6rem;">
                    </div>
                </div>
                
                <div style="border-top:1px solid var(--border-color); padding-top:1.25rem; margin-top:0.5rem;">
                    <h4 style="font-family:'Outfit', sans-serif; font-size:1rem; font-weight:600; margin-bottom:1rem; color:var(--primary);">Datos del Propietario (Usuario Administrador)</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre Completo</label>
                            <input type="text" id="reg-prop-nombre" required placeholder="Tu Nombre y Apellido" style="padding:0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Contraseña para el Taller</label>
                            <input type="password" id="reg-prop-pass" required placeholder="Mínimo 4 caracteres" style="padding:0.6rem;">
                        </div>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary" style="margin-top:1rem; padding:0.8rem; font-size:1rem; font-weight:600;"><i class="fa-solid fa-paper-plane"></i> Enviar Solicitud de Registro</button>
            </form>
        </div>
    `;
    
    const form = document.getElementById('saas-register-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const db = getDatabase();
        const requestId = 'REQ-' + Date.now();
        const requestData = {
            id: requestId,
            nombre: document.getElementById('reg-taller-nombre').value,
            giro: document.getElementById('reg-taller-giro').value,
            direccion: document.getElementById('reg-taller-direccion').value,
            telefono: document.getElementById('reg-taller-telefono').value,
            correo: document.getElementById('reg-taller-correo').value,
            nit: document.getElementById('reg-taller-nit').value,
            nrc: document.getElementById('reg-taller-nrc').value,
            logoText: document.getElementById('reg-taller-nombre').value.substring(0, 15).toUpperCase(),
            logoTagline: 'Servicio Automotriz Especializado',
            propietario: document.getElementById('reg-prop-nombre').value,
            pass: document.getElementById('reg-prop-pass').value,
            status: 'pendiente',
            createdAt: Date.now(),
            dte_config: {
                apiKey: 'test_sk_mecanicos_default_sandbox_key_998877',
                ambiente: '00',
                mhCode: '0001',
                posNumber: '1',
                backendUrl: ''
            }
        };
        
        db.solicitudes_registro.push(requestData);
        db.saas_state = {
            status: 'pending',
            workshopData: requestData,
            termsSigned: false,
            signatureName: '',
            signedAt: null
        };
        
        saveDatabase(db);
        showToast("Solicitud de registro enviada con éxito", "success");
        window.location.hash = 'landing';
        handleRouting();
    });
}

function renderSuspendedSaaS(container) {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    const workshop = saas.workshopData || { nombre: 'tu taller', precio_mensual: 75.00 };
    
    container.innerHTML = `
        <div style="max-width: 650px; margin: 6rem auto; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--danger); border-radius: 12px; text-align: center; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.15);">
            <div style="font-size: 5rem; color: var(--danger); margin-bottom: 1.5rem;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
                Acceso Suspendido
            </h2>
            <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6; margin-bottom: 2rem;">
                La suscripción para el taller <strong>${workshop.nombre}</strong> se encuentra temporalmente inhabilitada.<br>
                Esto puede deberse a un saldo pendiente de pago o a la finalización del período de prueba.
            </p>
            
            <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-around; align-items: center;">
                <div style="text-align: left;">
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Concepto</span>
                    <strong style="display: block; font-size: 1rem; color: var(--text-primary); margin-top: 0.25rem;">Mensualidad Mecanic OS</strong>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Total Pendiente</span>
                    <strong style="display: block; font-size: 1.5rem; color: var(--danger); margin-top: 0.25rem;">$${Number(workshop.precio_mensual || 0).toFixed(2)}</strong>
                </div>
            </div>
            
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2rem;">
                Para restablecer tu acceso, por favor ponte en contacto con administración a través del correo 
                <a href="mailto:ventas@forbiddensoluciones.com" style="color: var(--primary); text-decoration: none; font-weight: 600;">ventas@forbiddensoluciones.com</a> 
                o llama al <strong>7815-0614</strong>.
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
                <a href="#admin-solicitudes" class="btn btn-primary" style="padding: 0.75rem 1.5rem; text-decoration: none; background: var(--primary);">
                    <i class="fa-solid fa-user-shield"></i> Consola del Administrador (Simular Pago y Reactivar)
                </a>
            </div>
        </div>
    `;
}

function renderAdminSolicitudes(container) {
    const db = getDatabase();
    const solicitudes = db.solicitudes_registro || [];
    const payments = db.saas_payments || [];
    
    // Set default tab if not set
    if (!window.activeSaaSTab) {
        window.activeSaaSTab = 'sub'; // Default to Suscripciones
    }
    const activeTab = window.activeSaaSTab;
    
    // Helper to switch tab
    window.switchSaaSTab = function(tabName) {
        window.activeSaaSTab = tabName;
        window.saasEditWorkshopId = null;
        window.saasPayWorkshopId = null;
        renderAdminSolicitudes(container);
    };
    
    // Close forms
    window.saasCloseForm = function() {
        window.saasEditWorkshopId = null;
        window.saasPayWorkshopId = null;
        window.saasConfigWorkshopId = null;
        renderAdminSolicitudes(container);
    };

    // Form handlers
    window.handleSaasEditSubmit = function(e) {
        e.preventDefault();
        const id = window.saasEditWorkshopId;
        const plan = document.getElementById('edit-saas-plan').value;
        const price = parseFloat(document.getElementById('edit-saas-price').value);
        const status = document.getElementById('edit-saas-status').value;
        
        const workshop = solicitudes.find(s => s.id === id);
        if (workshop) {
            workshop.plan = plan;
            workshop.precio_mensual = price;
            workshop.suscripcion_status = status;
            
            // If this is the active workshop being used in the app, sync the active saas_state
            const saasState = db.saas_state;
            if (saasState.workshopData && saasState.workshopData.id === id) {
                saasState.workshopData.plan = plan;
                saasState.workshopData.precio_mensual = price;
                saasState.workshopData.suscripcion_status = status;
                
                // Reactivate or suspend the active user state
                if (status === 'suspendido') {
                    saasState.status = 'suspended';
                } else if (saasState.status === 'suspended' && (status === 'activo' || status === 'demo')) {
                    saasState.status = 'active';
                }
            }
            
            saveDatabase(db);
            showToast("Suscripción actualizada correctamente.", "success");
            window.saasCloseForm();
        }
    };
    
    window.handleSaasPaySubmit = function(e) {
        e.preventDefault();
        const id = window.saasPayWorkshopId;
        const workshop = solicitudes.find(s => s.id === id);
        if (workshop) {
            const monto = parseFloat(document.getElementById('pay-saas-monto').value);
            const metodo = document.getElementById('pay-saas-metodo').value;
            const factura = document.getElementById('pay-saas-factura').value;
            const fecha = Date.parse(document.getElementById('pay-saas-fecha').value) || Date.now();
            
            const newPayment = {
                id: 'PAY-' + Date.now().toString().slice(-4),
                workshopId: id,
                workshopName: workshop.nombre,
                plan: workshop.plan,
                monto: monto,
                fecha: fecha,
                factura: factura,
                metodo: metodo,
                estado: 'completado'
            };
            
            db.saas_payments.push(newPayment);
            
            // Push next billing date 30 days
            workshop.proximo_pago = Date.now() + 30 * 24 * 60 * 60 * 1000;
            if (db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                db.saas_state.workshopData.proximo_pago = workshop.proximo_pago;
            }
            
            saveDatabase(db);
            showToast("Pago registrado con éxito y vigencia extendida.", "success");
            window.saasCloseForm();
        }
    };

    // Render forms if active
    if (window.saasEditWorkshopId) {
        const id = window.saasEditWorkshopId;
        const workshop = solicitudes.find(s => s.id === id);
        if (!workshop) {
            window.saasCloseForm();
            return;
        }
        
        container.innerHTML = `
            <div style="max-width:600px; margin:4rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                    <div>
                        <h2 style="font-family:'Outfit', sans-serif; font-size:1.5rem; font-weight:700; color:var(--text-primary);">Editar Suscripción</h2>
                        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Taller: <strong>${workshop.nombre}</strong></p>
                    </div>
                    <button onclick="window.saasCloseForm()" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                
                <form onsubmit="window.handleSaasEditSubmit(event)" style="display:flex; flex-direction:column; gap:1.25rem;">
                    <div class="form-group">
                        <label>Plan de Suscripción</label>
                        <select id="edit-saas-plan" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            <option value="Basic" ${workshop.plan === 'Basic' ? 'selected' : ''}>Basic ($45/mes)</option>
                            <option value="Pro" ${workshop.plan === 'Pro' ? 'selected' : ''}>Pro ($75/mes)</option>
                            <option value="Enterprise" ${workshop.plan === 'Enterprise' ? 'selected' : ''}>Enterprise ($120/mes)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Cuota Mensual Negociada ($ USD)</label>
                        <input type="number" step="0.01" id="edit-saas-price" required value="${workshop.precio_mensual || 75.00}" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                    </div>
                    
                    <div class="form-group">
                        <label>Estado de Suscripción</label>
                        <select id="edit-saas-status" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            <option value="activo" ${workshop.suscripcion_status === 'activo' ? 'selected' : ''}>Activo (Acceso Completo)</option>
                            <option value="suspendido" ${workshop.suscripcion_status === 'suspendido' ? 'selected' : ''}>Suspendido (Acceso Bloqueado)</option>
                            <option value="demo" ${workshop.suscripcion_status === 'demo' ? 'selected' : ''}>Demo (Prueba Gratuita)</option>
                        </select>
                    </div>
                    
                    <div style="display:flex; gap:1rem; margin-top:1rem;">
                        <button type="submit" class="btn btn-primary" style="flex:1; padding:0.75rem;"><i class="fa-solid fa-save"></i> Guardar Cambios</button>
                        <button type="button" onclick="window.saasCloseForm()" class="btn btn-secondary" style="flex:1; padding:0.75rem;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        return;
    }
    
    if (window.saasConfigWorkshopId) {
        const id = window.saasConfigWorkshopId;
        const workshop = solicitudes.find(s => s.id === id);
        if (!workshop) {
            window.saasCloseForm();
            return;
        }

        const dte = workshop.dte_config || {
            apiKey: '',
            ambiente: '00',
            mhCode: '0001',
            posNumber: '1',
            backendUrl: ''
        };
        const fb = workshop.firebase_config || {
            apiKey: '',
            authDomain: '',
            projectId: ''
        };

        container.innerHTML = `
            <div style="max-width:650px; margin:3rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                    <div>
                        <h2 style="font-family:'Outfit', sans-serif; font-size:1.5rem; font-weight:700; color:var(--text-primary);">Configuración Técnica DTE & Nube</h2>
                        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Taller: <strong>${workshop.nombre}</strong></p>
                    </div>
                    <button onclick="window.saasCloseForm()" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                
                <form id="saas-tech-config-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                    <h3 style="font-size:1.05rem; border-left:3px solid var(--primary); padding-left:0.5rem; color:var(--text-primary); margin:0;">Credenciales FacturaLlama (DTE)</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Ambiente de Emisión</label>
                            <select id="tech-ambiente" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                <option value="00" ${dte.ambiente === '00' ? 'selected' : ''}>00 - Pruebas / Sandbox</option>
                                <option value="01" ${dte.ambiente === '01' ? 'selected' : ''}>01 - Producción / En Vivo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>API Key de FacturaLlama</label>
                            <input type="password" id="tech-api-key" value="${dte.apiKey || ''}" placeholder="sk_test_... o sk_live_..." style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Código Establecimiento MH</label>
                            <input type="text" id="tech-mh-code" value="${dte.mhCode || '0001'}" placeholder="0001" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Número de POS</label>
                            <input type="number" id="tech-pos-number" value="${dte.posNumber || '1'}" placeholder="1" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>URL Servidor Proxy (Opcional, vacío usa local)</label>
                        <input type="text" id="tech-backend-url" value="${dte.backendUrl || ''}" placeholder="https://..." style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                    </div>

                    <h3 style="font-size:1.05rem; border-left:3px solid var(--primary); padding-left:0.5rem; color:var(--text-primary); margin-top:0.75rem; margin-bottom:0;">Base de Datos (Google Firebase Custom Config)</h3>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin:0;">Deja en blanco para usar la base de datos centralizada estándar de Mecanic OS.</p>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Firebase API Key</label>
                            <input type="text" id="tech-fb-apikey" value="${fb.apiKey || ''}" placeholder="AIzaSy..." style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Auth Domain</label>
                            <input type="text" id="tech-fb-authdomain" value="${fb.authDomain || ''}" placeholder="taller.firebaseapp.com" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Project ID</label>
                        <input type="text" id="tech-fb-projectid" value="${fb.projectId || ''}" placeholder="taller-id" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                    </div>
                    
                    <div style="display:flex; gap:1rem; margin-top:1.5rem;">
                        <button type="submit" class="btn btn-primary" style="flex:1; padding:0.75rem;"><i class="fa-solid fa-save"></i> Guardar Configuración Técnica</button>
                        <button type="button" onclick="window.saasCloseForm()" class="btn btn-secondary" style="flex:1; padding:0.75rem;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('saas-tech-config-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const currentDb = getDatabase();
            const target = currentDb.solicitudes_registro.find(s => s.id === id);
            if (target) {
                target.dte_config = {
                    apiKey: document.getElementById('tech-api-key').value,
                    ambiente: document.getElementById('tech-ambiente').value,
                    mhCode: document.getElementById('tech-mh-code').value,
                    posNumber: document.getElementById('tech-pos-number').value,
                    backendUrl: document.getElementById('tech-backend-url').value
                };

                const fbKey = document.getElementById('tech-fb-apikey').value.trim();
                const fbDomain = document.getElementById('tech-fb-authdomain').value.trim();
                const fbProj = document.getElementById('tech-fb-projectid').value.trim();

                if (fbKey && fbDomain && fbProj) {
                    target.firebase_config = {
                        apiKey: fbKey,
                        authDomain: fbDomain,
                        projectId: fbProj,
                        storageBucket: `${fbProj}.appspot.com`,
                        messagingSenderId: "1234567890",
                        appId: `1:1234567890:web:${Math.random().toString(36).substring(7)}`
                    };
                } else {
                    delete target.firebase_config;
                }

                const activeState = currentDb.saas_state;
                if (activeState && activeState.workshopData && activeState.workshopData.id === id) {
                    activeState.workshopData.dte_config = target.dte_config;
                    activeState.workshopData.firebase_config = target.firebase_config;

                    localStorage.setItem('mecanic_os_dte_config', JSON.stringify(target.dte_config));
                    if (target.firebase_config) {
                        localStorage.setItem('mecanic_os_firebase_config', JSON.stringify(target.firebase_config));
                    } else {
                        localStorage.removeItem('mecanic_os_firebase_config');
                    }
                }

                saveDatabase(currentDb);
                showToast("Configuración técnica actualizada y aplicada.", "success");
                window.saasCloseForm();
            }
        });
        return;
    }

    if (window.saasPayWorkshopId) {
        const id = window.saasPayWorkshopId;
        const workshop = solicitudes.find(s => s.id === id);
        if (!workshop) {
            window.saasCloseForm();
            return;
        }
        
        const todayStr = new Date().toISOString().split('T')[0];
        const nextFacturaNum = 'SUS-' + new Date().getFullYear() + '-' + String(payments.length + 1).padStart(3, '0');
        
        container.innerHTML = `
            <div style="max-width:600px; margin:4rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                    <div>
                        <h2 style="font-family:'Outfit', sans-serif; font-size:1.5rem; font-weight:700; color:var(--text-primary);">Registrar Pago Recibido</h2>
                        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Taller: <strong>${workshop.nombre}</strong></p>
                    </div>
                    <button onclick="window.saasCloseForm()" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                
                <form onsubmit="window.handleSaasPaySubmit(event)" style="display:flex; flex-direction:column; gap:1.25rem;">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Monto Pagado ($ USD)</label>
                            <input type="number" step="0.01" id="pay-saas-monto" required value="${workshop.precio_mensual || 75.00}" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Método de Pago</label>
                            <select id="pay-saas-metodo" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                <option value="Transferencia Bancaria (Banco Agrícola)">Transferencia Bancaria</option>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta de Crédito (Visa)">Tarjeta de Crédito</option>
                                <option value="Chivo Wallet (Bitcoin)">Chivo Wallet (Bitcoin)</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Número de Recibo / Factura</label>
                            <input type="text" id="pay-saas-factura" required value="${nextFacturaNum}" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Fecha de Pago</label>
                            <input type="date" id="pay-saas-fecha" required value="${todayStr}" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:1rem; margin-top:1rem;">
                        <button type="submit" class="btn btn-primary" style="flex:1; padding:0.75rem;"><i class="fa-solid fa-file-invoice-dollar"></i> Registrar Pago y Activar</button>
                        <button type="button" onclick="window.saasCloseForm()" class="btn btn-secondary" style="flex:1; padding:0.75rem;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        return;
    }
    
    // Toggle Status Helper
    window.toggleWorkshopStatus = function(id) {
        const workshop = solicitudes.find(s => s.id === id);
        if (workshop) {
            const oldStatus = workshop.suscripcion_status || 'activo';
            const newStatus = oldStatus === 'activo' || oldStatus === 'demo' ? 'suspendido' : 'activo';
            
            workshop.suscripcion_status = newStatus;
            
            // Sync with active state
            if (db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                db.saas_state.workshopData.suscripcion_status = newStatus;
                db.saas_state.status = newStatus === 'suspendido' ? 'suspended' : 'active';
            }
            
            saveDatabase(db);
            showToast(`Suscripción ${newStatus === 'activo' ? 'activada' : 'suspendida'} con éxito.`, "info");
            renderAdminSolicitudes(container);
        }
    };
    
    // Main UI
    container.innerHTML = `
        <div style="max-width:1100px; margin:3rem auto; padding:1.5rem;">
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                <div>
                    <h2 style="font-family:'Outfit', sans-serif; font-size:2rem; font-weight:800; color:var(--text-primary);"><i class="fa-solid fa-user-shield" style="color:var(--primary);"></i> Consola del Administrador SaaS</h2>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Panel central de control para suscripciones, cobros y clientes de Mecanic OS</p>
                </div>
                <div style="display:flex; gap:0.75rem;">
                    <button id="btn-reset-demo-saas" class="btn btn-secondary" style="color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-trash-can"></i> Reiniciar Onboarding</button>
                    <a href="#taller-dashboard" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Volver a App</a>
                </div>
            </div>
            
            <!-- Tabs Bar -->
            <div class="saas-tabs-container">
                <button class="saas-tab-btn ${activeTab === 'sub' ? 'active' : ''}" onclick="window.switchSaaSTab('sub')"><i class="fa-solid fa-users-gear"></i> Suscripciones & Clientes</button>
                <button class="saas-tab-btn ${activeTab === 'req' ? 'active' : ''}" onclick="window.switchSaaSTab('req')"><i class="fa-solid fa-clock-rotate-left"></i> Solicitudes (${solicitudes.filter(s => s.status === 'pendiente').length})</button>
                <button class="saas-tab-btn ${activeTab === 'pay' ? 'active' : ''}" onclick="window.switchSaaSTab('pay')"><i class="fa-solid fa-receipt"></i> Historial de Cobros</button>
                <button class="saas-tab-btn ${activeTab === 'metrics' ? 'active' : ''}" onclick="window.switchSaaSTab('metrics')"><i class="fa-solid fa-chart-line"></i> Métricas SaaS</button>
            </div>
            
            <!-- Tab Body -->
            <div class="saas-tab-body">
                ${activeTab === 'req' ? renderRequestsTab() : ''}
                ${activeTab === 'sub' ? renderSubscriptionsTab() : ''}
                ${activeTab === 'pay' ? renderPaymentsTab() : ''}
                ${activeTab === 'metrics' ? renderMetricsTab() : ''}
            </div>
        </div>
    `;
    
    // Bind global reset button
    const resetBtn = document.getElementById('btn-reset-demo-saas');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("ADVERTENCIA: Esto reiniciará el estado de onboarding del Taller al modo Invitado y vaciará los clientes cargados.\n¿Proceder?")) {
                db.saas_state = {
                    status: 'guest',
                    workshopData: null,
                    termsSigned: false,
                    signatureName: '',
                    signedAt: null
                };
                db.config_taller = null;
                db.solicitudes_registro = [];
                db.saas_payments = [];
                saveDatabase(db);
                showToast("Plataforma reiniciada a modo Invitado (Listo para simular)", "info");
                window.location.hash = 'landing';
                handleRouting();
            }
        });
    }
    
    // Bind approve/reject buttons
    if (activeTab === 'req') {
        document.querySelectorAll('.btn-approve-saas').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("¿Está seguro de que desea APROBAR esta solicitud comercial? El cliente deberá firmar los términos del servicio.")) {
                    const req = solicitudes.find(s => s.id === id);
                    req.status = 'aprobado';
                    
                    req.plan = req.plan || 'Pro';
                    req.precio_mensual = req.precio_mensual || 75.00;
                    req.suscripcion_status = req.suscripcion_status || 'activo';
                    req.proximo_pago = req.proximo_pago || (Date.now() + 30 * 24 * 60 * 60 * 1000);
                    
                    db.saas_state = {
                        status: 'approved_terms_pending',
                        workshopData: req,
                        termsSigned: false,
                        signatureName: '',
                        signedAt: null
                    };
                    
                    saveDatabase(db);
                    showToast("Solicitud aprobada con éxito. Listo para la firma del cliente.", "success");
                    renderAdminSolicitudes(container);
                }
            });
        });
        
        document.querySelectorAll('.btn-reject-saas').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("¿Está seguro de que desea RECHAZAR esta solicitud?")) {
                    const req = solicitudes.find(s => s.id === id);
                    req.status = 'rechazado';
                    
                    if (db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                        db.saas_state = { status: 'guest', workshopData: null, termsSigned: false };
                    }
                    
                    saveDatabase(db);
                    showToast("Solicitud rechazada", "warning");
                    renderAdminSolicitudes(container);
                }
            });
        });
    }
    
    // Switch state actions
    if (activeTab === 'sub') {
        document.querySelectorAll('.btn-edit-sub').forEach(btn => {
            btn.addEventListener('click', () => {
                window.saasEditWorkshopId = btn.getAttribute('data-id');
                renderAdminSolicitudes(container);
            });
        });
        document.querySelectorAll('.btn-pay-sub').forEach(btn => {
            btn.addEventListener('click', () => {
                window.saasPayWorkshopId = btn.getAttribute('data-id');
                renderAdminSolicitudes(container);
            });
        });
        document.querySelectorAll('.btn-config-saas').forEach(btn => {
            btn.addEventListener('click', () => {
                window.saasConfigWorkshopId = btn.getAttribute('data-id');
                renderAdminSolicitudes(container);
            });
        });
    }

    // Sub-renderers
    function renderRequestsTab() {
        if (solicitudes.length === 0) {
            return `
                <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                    <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"><i class="fa-solid fa-folder-open"></i></div>
                    <p>No hay solicitudes de registro registradas en este momento.</p>
                </div>
            `;
        }
        return `
            <div class="glass-card" style="padding:1.5rem;">
                <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; margin-bottom:1rem; color:var(--text-primary);">Historial de Solicitudes</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Taller</th>
                                <th>Contacto / Propietario</th>
                                <th>NIT / NRC</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${solicitudes.map(s => {
                                let badgeColor = 'badge-warning';
                                if (s.status === 'aprobado') badgeColor = 'badge-success';
                                if (s.status === 'rechazado') badgeColor = 'badge-danger';
                                
                                return `
                                    <tr>
                                        <td>${new Date(s.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <strong>${s.nombre}</strong><br>
                                            <small style="color:var(--text-muted);">${s.giro}</small><br>
                                            <small style="color:var(--text-muted); font-size:0.75rem;">${s.direccion}</small>
                                        </td>
                                        <td>
                                            <strong>${s.propietario}</strong><br>
                                            <small style="color:var(--text-muted);">${s.correo}</small><br>
                                            <small style="color:var(--text-muted); font-size:0.75rem;">TEL: ${s.telefono}</small>
                                        </td>
                                        <td>
                                            <small>NIT: ${s.nit}</small><br>
                                            <small>NRC: ${s.nrc}</small>
                                        </td>
                                        <td><span class="badge-tag ${badgeColor}">${s.status.toUpperCase()}</span></td>
                                        <td>
                                            ${s.status === 'pendiente' 
                                                ? `
                                                    <div style="display:flex; gap:0.5rem;">
                                                        <button class="btn btn-primary btn-approve-saas" data-id="${s.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;"><i class="fa-solid fa-circle-check"></i> Aprobar</button>
                                                        <button class="btn btn-secondary btn-reject-saas" data-id="${s.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem; color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Rechazar</button>
                                                    </div>
                                                ` 
                                                : `<span style="font-size:0.8rem; color:var(--text-muted);">Procesado</span>`}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    function renderSubscriptionsTab() {
        const approvedClients = solicitudes.filter(s => s.status === 'aprobado');
        if (approvedClients.length === 0) {
            return `
                <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                    <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"><i class="fa-solid fa-user-xmark"></i></div>
                    <p>No hay clientes o talleres activos aprobados en este momento.</p>
                </div>
            `;
        }
        
        return `
            <div class="glass-card" style="padding:1.5rem;">
                <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; margin-bottom:1rem; color:var(--text-primary);">Registro de Clientes y Suscripciones Negociadas</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Taller / Cliente</th>
                                <th>Contacto</th>
                                <th>Plan Contratado</th>
                                <th>Cuota Mensual</th>
                                <th>Estado</th>
                                <th>Renovación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${approvedClients.map(c => {
                                const plan = c.plan || 'Pro';
                                const price = c.precio_mensual || 75.00;
                                const status = c.suscripcion_status || 'activo';
                                const nextPay = c.proximo_pago ? new Date(c.proximo_pago).toLocaleDateString() : 'N/A';
                                
                                let badgeColor = 'badge-success';
                                if (status === 'suspendido') badgeColor = 'badge-danger';
                                if (status === 'demo') badgeColor = 'badge-warning';
                                
                                const isCurrent = db.saas_state.workshopData && db.saas_state.workshopData.id === c.id;
                                
                                return `
                                    <tr style="${isCurrent ? 'background:rgba(99, 102, 241, 0.05); border-left:3px solid var(--primary);' : ''}">
                                        <td>
                                            <strong>${c.nombre}</strong> ${isCurrent ? '<span style="font-size:0.7rem; background:var(--primary); color:white; padding:1px 5px; border-radius:3px; margin-left:5px;">ACTIVO EN SESIÓN</span>' : ''}<br>
                                            <small style="color:var(--text-muted);">${c.giro}</small><br>
                                            <small style="color:var(--text-muted); font-size:0.75rem;">${c.direccion}</small>
                                        </td>
                                        <td>
                                            <strong>${c.propietario}</strong><br>
                                            <small style="color:var(--text-muted);">${c.correo}</small><br>
                                            <small style="color:var(--text-muted); font-size:0.75rem;">TEL: ${c.telefono}</small>
                                        </td>
                                        <td>
                                            <strong style="color:var(--primary);">${plan.toUpperCase()}</strong>
                                        </td>
                                        <td>
                                            <strong style="font-size:1rem; color:var(--text-primary);">$${price.toFixed(2)}</strong>
                                        </td>
                                        <td><span class="badge-tag ${badgeColor}">${status.toUpperCase()}</span></td>
                                        <td>
                                            <span style="${c.proximo_pago && c.proximo_pago < Date.now() ? 'color:var(--danger); font-weight:bold;' : 'color:var(--text-primary);'}">
                                                ${nextPay}
                                            </span>
                                            ${c.proximo_pago && c.proximo_pago < Date.now() ? '<br><small style="color:var(--danger);">VENCIDO</small>' : ''}
                                        </td>
                                        <td>
                                            <div style="display:flex; flex-direction:column; gap:0.4rem; max-width:140px;">
                                                <button class="btn btn-secondary btn-edit-sub" data-id="${c.id}" style="padding:0.35rem; font-size:0.75rem;"><i class="fa-solid fa-edit"></i> Ajustar Plan</button>
                                                <button class="btn btn-primary btn-pay-sub" data-id="${c.id}" style="padding:0.35rem; font-size:0.75rem;"><i class="fa-solid fa-dollar-sign"></i> Cobrar Cuota</button>
                                                <button class="btn btn-secondary btn-config-saas" data-id="${c.id}" style="padding:0.35rem; font-size:0.75rem; color:var(--primary); border-color:var(--primary);"><i class="fa-solid fa-gears"></i> Configurar DTE/BD</button>
                                                <button class="btn btn-secondary" onclick="window.toggleWorkshopStatus('${c.id}')" style="padding:0.35rem; font-size:0.75rem; color:${status === 'suspendido' ? 'var(--success)' : 'var(--danger)'}; border-color:${status === 'suspendido' ? 'var(--success)' : 'var(--danger)'};">
                                                    <i class="fa-solid ${status === 'suspendido' ? 'fa-play' : 'fa-pause'}"></i> ${status === 'suspendido' ? 'Activar' : 'Suspender'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    function renderPaymentsTab() {
        if (payments.length === 0) {
            return `
                <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                    <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"><i class="fa-solid fa-receipt"></i></div>
                    <p>No se han registrado pagos en el historial.</p>
                </div>
            `;
        }
        
        return `
            <div class="glass-card" style="padding:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; color:var(--text-primary); margin:0;">Registro de Cobros Recibidos</h3>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha Recibo</th>
                                <th>Taller / Cliente</th>
                                <th>Plan</th>
                                <th>N° Comprobante</th>
                                <th>Método de Pago</th>
                                <th>Monto Recaudado</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.slice().sort((a,b) => b.fecha - a.fecha).map(p => `
                                <tr>
                                    <td>${new Date(p.fecha).toLocaleDateString()}</td>
                                    <td><strong>${p.workshopName}</strong></td>
                                    <td><span style="font-size:0.75rem; background:rgba(99, 102, 241, 0.1); color:var(--primary); padding:2px 6px; border-radius:3px; font-weight:bold;">${p.plan}</span></td>
                                    <td><code style="font-family:monospace; font-size:0.9rem;">${p.factura}</code></td>
                                    <td>${p.metodo}</td>
                                    <td><strong style="color:var(--success); font-size:0.95rem;">$${Number(p.monto).toFixed(2)}</strong></td>
                                    <td><span class="badge-tag badge-success">${p.estado.toUpperCase()}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    function renderMetricsTab() {
        const approvedClients = solicitudes.filter(s => s.status === 'aprobado');
        const activeClients = approvedClients.filter(c => c.suscripcion_status === 'activo' || c.suscripcion_status === 'demo');
        const suspendedClients = approvedClients.filter(c => c.suscripcion_status === 'suspendido');
        
        // Calculate MRR
        const mrr = activeClients.reduce((sum, c) => sum + (c.precio_mensual || 75.00), 0);
        // Total collected
        const totalCollected = payments.reduce((sum, p) => sum + Number(p.monto), 0);
        
        return `
            <div class="saas-metrics-grid">
                <div class="metric-card-saas primary">
                    <span class="metric-label">Ingreso Mensual Recurrente (MRR)</span>
                    <div class="metric-val">$${mrr.toFixed(2)}</div>
                    <small style="color:var(--text-muted);">Suma de cuotas mensuales activas</small>
                </div>
                <div class="metric-card-saas success">
                    <span class="metric-label">Recaudación Total Histórica</span>
                    <div class="metric-val">$${totalCollected.toFixed(2)}</div>
                    <small style="color:var(--text-muted);">${payments.length} facturas de suscripción cobradas</small>
                </div>
                <div class="metric-card-saas warning">
                    <span class="metric-label">Clientes Activos / Demo</span>
                    <div class="metric-val">${activeClients.length}</div>
                    <small style="color:var(--text-muted);">${approvedClients.length} talleres en total aprobados</small>
                </div>
                <div class="metric-card-saas danger">
                    <span class="metric-label">Clientes Suspendidos</span>
                    <div class="metric-val">${suspendedClients.length}</div>
                    <small style="color:var(--text-muted);">Talleres con el acceso deshabilitado</small>
                </div>
            </div>
            
            <div class="glass-card" style="padding:2rem; margin-top:1.5rem;">
                <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; margin-bottom:1.5rem; color:var(--text-primary);">Distribución Financiera y Cobros por Cliente</h3>
                
                <div style="display:flex; flex-wrap:wrap; gap:2rem; justify-content:space-around; align-items:center;">
                    <!-- SVG mini visual chart representing MRR share -->
                    <div style="text-align:center;">
                        <svg width="200" height="200" viewBox="0 0 200 200" style="transform: rotate(-90deg);">
                            <circle r="70" cx="100" cy="100" fill="transparent" stroke="var(--border-color)" stroke-width="20"></circle>
                            <!-- Circle segments representing MRR portion -->
                            <circle r="70" cx="100" cy="100" fill="transparent" stroke="var(--primary)" stroke-width="20" stroke-dasharray="240 440" stroke-dashoffset="0"></circle>
                            <circle r="70" cx="100" cy="100" fill="transparent" stroke="var(--success)" stroke-width="20" stroke-dasharray="150 440" stroke-dashoffset="-240"></circle>
                            <circle r="70" cx="100" cy="100" fill="transparent" stroke="var(--warning)" stroke-width="20" stroke-dasharray="50 440" stroke-dashoffset="-390"></circle>
                        </svg>
                        <div style="margin-top:1rem; font-size:0.85rem; color:var(--text-secondary);">Participación de MRR por Taller</div>
                    </div>
                    
                    <div style="flex:1; min-width:280px; display:flex; flex-direction:column; gap:1rem;">
                        ${approvedClients.map(c => {
                            const share = mrr > 0 ? (((c.precio_mensual || 75.00) / mrr) * 100) : 0;
                            let color = 'var(--primary)';
                            if (c.id === 'REQ-ESCANDON') color = 'var(--success)';
                            if (c.id === 'REQ-PROGRESO') color = 'var(--warning)';
                            return `
                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                                        <span><strong>${c.nombre}</strong> (${c.plan})</span>
                                        <span>$${(c.precio_mensual || 75.00).toFixed(2)}/mes (${share.toFixed(0)}%)</span>
                                    </div>
                                    <div style="height:6px; background:var(--border-color); border-radius:3px; overflow:hidden;">
                                        <div style="width:${share}%; height:100%; background:${color}; border-radius:3px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

function renderTerminosSaaS(container) {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    
    if (saas.status !== 'approved_terms_pending') {
        window.location.hash = 'landing';
        handleRouting();
        return;
    }
    
    container.innerHTML = `
        <div style="max-width:750px; margin:4rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="text-align:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1.5rem;">
                <div style="font-size: 3rem; color: var(--success); margin-bottom: 0.5rem;"><i class="fa-solid fa-circle-check"></i></div>
                <h2 style="font-family:'Outfit', sans-serif; font-size:1.85rem; font-weight:800; color:var(--text-primary);">¡Registro Aprobado con Éxito!</h2>
                <p style="color:var(--text-secondary); font-size:0.95rem; margin-top:0.5rem;">
                    La solicitud para el taller <strong>${saas.workshopData.nombre}</strong> fue aprobada.
                </p>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-top:0.25rem;">
                    Para activar la plataforma y comenzar a operar, por favor revisa y firma los Términos y Condiciones.
                </p>
            </div>
            
            <div style="background:var(--bg-base); border:1px solid var(--border-color); border-radius:6px; padding:1.5rem; max-height:280px; overflow-y:scroll; font-size:0.8rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1.5rem; font-family:'Courier New', monospace; white-space:pre-wrap; text-align:left;">TÉRMINOS Y CONDICIONES DE USO
MECANIC OS
Fecha de Última Actualización: 27 de Octubre de 2025

IMPORTANTE: Lea detenidamente estos Términos y Condiciones de Uso (en adelante, los "Términos") antes de utilizar la aplicación móvil MECANIC OS (en adelante, la "App"). Estos Términos constituyen un acuerdo legal vinculante entre usted (en adelante, el "Usuario") y David Antonio Mejía Ramírez (en adelante, el "Proveedor"), con domicilio legal en Res las Margaritas, Senda los Caobos # 13 Santa Tecla La libertad.

Al acceder o utilizar la App, usted acepta quedar obligado por estos Términos y por nuestra Política de Privacidad. Si no está de acuerdo con alguna parte de estos Términos, no debe utilizar la App.

1. DEFINICIONES
● App o Aplicación: Se refiere a la aplicación móvil MECANIC OS, creada mediante la plataforma AppSheet y operada por el Proveedor.
● Usuario: Cualquier persona natural o jurídica que accede, descarga o utiliza la App.
● Contenido del Usuario: Datos, imágenes, archivos, texto o cualquier información que el Usuario ingrese o cargue a la App.
● Servicio: Las funcionalidades, operaciones y la información proporcionada al Usuario a través de la App.

2. OBJETO DEL SERVICIO
La App tiene como finalidad la gestión integral de las operaciones de talleres y centros de servicio automotriz, incluyendo (pero no limitándose a) los siguientes módulos:
1. Clientes
2. Productos (gestión de márgenes y tarifas)
3. Inventario
4. Movimientos de Inventario
5. Revisión de Vehículos (con soporte para imágenes y videos)
6. Presupuestos
7. Compras y Ventas
8. Base de Datos de Cambios de Aceite
9. Mano de Obra
10. Módulo de Fidelización
11. Dashboard (visualización de ventas y cumplimiento de objetivos)
12. Opciones de Inversión.

El acceso al Servicio está sujeto a.

3. USO Y ACCESO A LA APP
3.1. Requisitos de Edad:
Al aceptar estos Términos, el Usuario declara ser mayor de dieciocho (18) años de edad y tener plena capacidad legal para obligarse. Si el Usuario es menor de edad, debe abstenerse de utilizar la App.

3.2. Cuentas y Contraseñas:
El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de toda actividad que se realice bajo su cuenta. El Proveedor no será responsable por pérdidas o daños que resulten del incumplimiento de esta obligación.

3.3. Uso Aceptable:
El Usuario se compromete a no utilizar la App para fines ilegales o no autorizados. Esto incluye, pero no se limita a:
a) Violar cualquier ley local, nacional o internacional, incluyendo la Ley de Protección al Consumidor y la legislación sobre protección de datos de El Salvador.
b) Intentar obtener acceso no autorizado a otros sistemas o redes de la plataforma AppSheet o del Proveedor.
c) Cargar contenido difamatorio, obsceno o que viole derechos de propiedad intelectual de terceros.

4. PROPIEDAD INTELLECTUAL Y LICENCIA DE USO
4.1. Propiedad del Proveedor:
El diseño, la interfaz (UI/UX), la arquitectura, el código base, las bases de datos, las plantillas y los flujos de trabajo de la App pertenecen exclusivamente a Forbidden Soluciones S.A. de C.V.

4.2. Licencia de Uso:
La App y sus funcionalidades son desarrolladas y entregadas bajo un modelo de licencia de uso no exclusivo. En ningún caso se entenderá que el Usuario adquiere derechos de propiedad intelectual, ni sobre el software base, ni sobre las personalizaciones realizadas.

4.3. Propiedad del Contenido del Usuario:
El Usuario únicamente conserva la propiedad de su Contenido de Usuario (los datos que ingrese a través de la App), pero otorga al Proveedor una licencia para usar, almacenar y procesar dicho Contenido con el único fin de prestar el Servicio.

5. RESTRICCIONES Y TÉRMINOS ESPECÍFICOS DE APPSHEET
5.1. Naturaleza de la Plataforma:
La App es una aplicación construida y desplegada a través de la plataforma AppSheet (de Google Cloud). El Usuario reconoce que el funcionamiento de la App depende de los términos de servicio y la infraestructura de AppSheet y de Google.

5.2. Suspensión del Servicio:
El Proveedor se reserva el derecho de suspender, temporal o permanentemente, el acceso del Usuario a la App sin previo aviso si incumple gravemente estos Términos, o si la cuenta del Usuario pone en riesgo la seguridad o la integridad de la plataforma AppSheet.

5.3. Actualizaciones y No Exclusividad de Funcionalidades:
El Proveedor se compromete a la constante actualización y optimización del Servicio. El Usuario reconoce y acepta explícitamente que las optimizaciones, mejoras o personalizaciones desarrolladas para esta App podrán ser utilizadas en otros proyectos. Dichas mejoras no constituyen propiedad exclusiva del Usuario ni generarán derechos de compensación, salvo acuerdo escrito en contrario. El uso de la App no otorga al Usuario derechos exclusivos sobre ninguna funcionalidad, diseño o mejora.

6. PROTECCIÓN DE DATOS PERSONALES Y DERECHOS ARCO-POL
6.1. Responsable del Tratamiento:
Forbidden Soluciones S.A. de C.V. actúa como responsable del tratamiento de los datos personales recopilados en la App.

6.2. Recopilación de Datos:
El Proveedor recopilará los datos personales que el Usuario ingrese en la App con la finalidad de prestar el Servicio.

6.3. Consentimiento Expreso (El Salvador):
En cumplimiento del marco normativo sobre la protección de datos personales en El Salvador, el Usuario otorga su consentimiento expreso, libre e informado para el tratamiento de sus datos personales. El tratamiento de datos sensibles (si aplica) requerirá un consentimiento específico adicional.

6.4. Derechos ARCO-POL:
El Proveedor garantiza al Usuario el ejercicio de sus derechos de:
● Acceso (A): Conocer qué datos personales tenemos.
● Rectificación (R): Solicitar la corrección de datos erróneos o incompletos.
● Cancelación/Eliminación (C/O): Solicitar la supresión de datos innecesarios.
● Oposición (P): Oponerse al tratamiento de datos para ciertos fines (ej. marketing).
● Portabilidad (O): Solicitar la transferencia de sus datos a otro responsable.
● Olvido (L): Solicitar la supresión de datos publicados en el entorno electrónico.

Para ejercer estos derechos, el Usuario deberá enviar una solicitud al correo electrónico: ventas@forbiddensoluciones.com.

6.5. Política de Privacidad:
La recopilación, uso y almacenamiento de los datos personales del Usuario se rigen por nuestra Política de Privacidad, la cual forma parte integral de estos Términos.

7. CONDICIONES ECONÓMICAS Y PAGO
7.1. Pago Oportuno:
Los servicios de licencia y uso de la App están sujetos al pago oportuno según lo acordado contractualmente en el documento de servicio suscrito por las partes.

7.2. Incumplimiento de Pago:
El incumplimiento de pago faculta al Proveedor a suspender el acceso a la App, el Servicio y los datos asociados, sin necesidad de notificación previa.

7.3. No Reembolsabilidad:
Los pagos realizados por la licencia de uso no son reembolsables, salvo error de cobro atribuible directamente al Proveedor.

8. SOPORTE TÉCNICO Y MANTENIMIENTO
8.1. Alcance del Soporte:
El soporte técnico provisto por el Proveedor se limita a la corrección de errores (bugs) que impidan el correcto funcionamiento de las funcionalidades existentes en la App y a la asistencia para el uso del sistema.

8.2. Exclusiones:
El soporte no incluye la realización de modificaciones, ampliaciones, integraciones con sistemas de terceros, o desarrollos adicionales. Cualquier requerimiento que exceda el soporte básico será considerado como desarrollo adicional y será cotizado y acordado por separado.

9. EXCLUSIÓN Y LIMITACIÓN DE RESPONSABILIDAD
El Servicio se proporciona "tal cual" y "según disponibilidad". El Proveedor no garantiza que la App esté libre de errores, que la información sea siempre exacta, o que la App funcione sin interrupciones. El Proveedor no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar la App, incluyendo, sin limitación, pérdidas de información, lucro cesante, interrupciones comerciales o daños a la reputación, excepto cuando la ley salvadoreña, especialmente la Ley de Protección al Consumidor, establezca lo contrario de forma imperativa.

10. MODIFICACIONES DE LOS TÉRMINOS
El Proveedor se reserva el derecho de modificar estos Términos en cualquier momento. Notificaremos a los Usuarios sobre cambios sustanciales mediante correo electrónico con al menos siete (7) días hábiles de antelación. El uso continuado de la App después de la entrada en vigor de las modificaciones constituye la aceptación de los nuevos Términos.

11. TERMINACIÓN Y CANCELACIÓN DEL SERVICIO
11.1. Terminación por Incumplimiento: El Proveedor podrá suspender o cancelar el acceso a la App y al Servicio de forma inmediata y sin responsabilidad si el Usuario incumple con sus obligaciones de pago, realiza un uso indebido o viola gravemente cualquiera de las cláusulas de estos Términos.

11.2. Fin del Servicio y Datos:
Al finalizar el servicio (por cualquier causa), el Usuario tendrá un plazo de 30 días para solicitar una copia de su Contenido de Usuario (datos). En ningún caso el Usuario tendrá derecho a solicitar el código fuente, la arquitectura, ni los archivos del sistema de la App, ya que estos son propiedad exclusiva del Proveedor.

12. DISPOSICIONES ADICIONALES
12.1. Confidencialidad:
El Usuario se compromete a no divulgar, reproducir o utilizar para fines ajenos, información técnica, procesos, métodos o la estructura interna del sistema de la App, aun después de finalizar la relación comercial.

12.2. Fuerza Mayor:
El Proveedor no será responsable por fallas, demoras o interrupciones derivadas de eventos fuera de su control razonable, incluyendo, pero no limitado a, fallos en la infraestructura de AppSheet o Google Cloud, cortes de energía eléctrica, desastres naturales o interrupciones de servicios de telecomunicaciones.

12.3. Prohibición de Uso Indebido y No Competencia:
El Usuario no podrá descompilar, aplicar ingeniería inversa, copiar, reproducir o desarrollar sistemas, software o aplicaciones similares basados en la App o en sus funcionalidades, sin la previa autorización escrita del Proveedor.

13. LEY APLICABLE Y JURISDICCIÓN
13.1. Ley Aplicable:
Estos Términos y su interpretación se rigen exclusivamente por las leyes de la República de El Salvador, sin dar efecto a ningún principio de conflicto de leyes.

13.2. Jurisdicción y Resolución de Controversias:
Las partes acuerdan que cualquier controversia será resuelta preferentemente mediante negociación directa. En caso de no llegar a acuerdo, las partes se someten a los tribunales competentes de San Salvador en El Salvador, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.

14. INFORMACIÓN DE CONTACTO
Para cualquier pregunta o comunicación relacionada con estos Términos y Condiciones, por favor contáctenos a:
Nombre: Forbidden Soluciones S.A. de C.V.
Correo Electrónico: ventas@forbiddensoluciones.com
Teléfono: 7815-0614
Dirección: Res las Margaritas, Senda los Caobos # 13 Santa Tecla La libertad.

FIN DE LOS TÉRMINOS Y CONDICIONES DE USO</div>
            
            <form id="saas-terms-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                <div class="form-group" style="flex-direction:row; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                    <input type="checkbox" id="terms-accept" required style="width:20px; height:20px; cursor:pointer;">
                    <label for="terms-accept" style="cursor:pointer; font-size:0.9rem; font-weight:600; color:var(--text-primary);">He leído, comprendo y acepto los Términos y Condiciones de Uso</label>
                </div>
                
                <div class="form-group">
                    <label>Firma Digital (Escribe tu Nombre Completo como Representante Legal)</label>
                    <input type="text" id="terms-signature-name" required placeholder="Ej: ${saas.workshopData.propietario}" style="padding:0.6rem; font-family:'Courier New', monospace; font-size:1.1rem; font-weight:bold; letter-spacing:0.05em; text-align:center;">
                </div>
                
                <button type="submit" class="btn btn-primary" style="padding:0.8rem; font-size:1.05rem; font-weight:700;"><i class="fa-solid fa-signature"></i> Firmar y Activar Plataforma</button>
            </form>
        </div>
    `;
    
    const form = document.getElementById('saas-terms-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const sigName = document.getElementById('terms-signature-name').value;
        const accepted = document.getElementById('terms-accept').checked;
        
        if (!accepted) {
            alert("Debe aceptar los términos y condiciones marcando la casilla correspondiente.");
            return;
        }
        
        db.saas_state = {
            status: 'active',
            workshopData: saas.workshopData,
            termsSigned: true,
            signatureName: sigName,
            signedAt: Date.now()
        };
        
        db.config_taller = {
            nombre: saas.workshopData.nombre,
            giro: saas.workshopData.giro,
            direccion: saas.workshopData.direccion,
            telefono: saas.workshopData.telefono,
            correo: saas.workshopData.correo,
            nit: saas.workshopData.nit,
            nrc: saas.workshopData.nrc,
            logoText: saas.workshopData.logoText,
            logoTagline: saas.workshopData.logoTagline
        };
        
        const exists = db.tecnicos.some(t => t.Nombre_Completo.toLowerCase() === saas.workshopData.propietario.toLowerCase());
        if (!exists) {
            const newTech = {
                Tecnico_ID: 'TECH-' + Date.now().toString().slice(-6),
                Nombre_Completo: saas.workshopData.propietario,
                Email: saas.workshopData.correo,
                Telefono: saas.workshopData.telefono,
                Especialidad: 'Gerente General',
                Nivel_Acceso: 'Administrador',
                Salario_Base: 1500,
                Contraseña: saas.workshopData.pass,
                Incapacidades: [],
                Vacaciones: [],
                Bonos: []
            };
            db.tecnicos.push(newTech);
            setActiveUser(newTech);
        }
        
        saveDatabase(db);
        updateSidebarBrand();
        updateUserUI();
        
        showToast("¡Plataforma Activada! Bienvenido a Mecanic OS.", "success");
        window.location.hash = 'taller-dashboard';
        handleRouting();
    });
}

// ----------------------------------------------------
// SYSTEM STARTUP & USER MODAL HANDLERS
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    initFirebase();
    bindFirebaseEvents();
    updateUserUI();
    updateSidebarBrand();
    startClock();
    
    // Mobile Navigation Drawer Toggle
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-menu-close');

    function closeMobileMenu() {
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }

    // Router bindings
    window.addEventListener('hashchange', () => {
        closeMobileMenu();
        handleRouting();
    });
    handleRouting();
    
    // Menu navigation click bindings
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.getAttribute('data-route');
            window.location.hash = route;
            closeMobileMenu();
        });
    });

    // User Switcher Modal Logic
    const userModal = document.getElementById('user-modal');
    const userSwitchBtn = document.getElementById('user-switch-btn');
    const closeUserModal = document.getElementById('close-user-modal');
    const usersSelectionGrid = document.getElementById('users-selection-grid');
    
    userSwitchBtn.addEventListener('click', () => {
        const db = getDatabase();
        usersSelectionGrid.innerHTML = '';
        usersSelectionGrid.style.display = 'grid';
        
        const introPara = userModal.querySelector('.modal-body > p');
        if (introPara) introPara.style.display = 'block';
        
        const existingForm = document.getElementById('switcher-password-form');
        if (existingForm) existingForm.remove();
        
        db.tecnicos.forEach(t => {
            const card = document.createElement('div');
            card.className = 'user-card';
            const avatar = t.Foto_Perfil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
            
            card.innerHTML = `
                <img src="${avatar}" class="avatar">
                <div style="display:flex; flex-direction:column;">
                    <strong style="font-size:0.9rem;">${t.Nombre_Completo}</strong>
                    <small style="color:var(--text-muted); font-size:0.75rem;">${t.Nivel_Acceso} • ${t.Especialidad || 'Mecánica'}</small>
                </div>
            `;
            
            card.addEventListener('click', () => {
                // Hide user grid and intro text
                usersSelectionGrid.style.display = 'none';
                if (introPara) introPara.style.display = 'none';
                
                // Remove any existing password form
                const currentForm = document.getElementById('switcher-password-form');
                if (currentForm) currentForm.remove();
                
                // Create password form
                const passForm = document.createElement('form');
                passForm.id = 'switcher-password-form';
                passForm.style.display = 'flex';
                passForm.style.flexDirection = 'column';
                passForm.style.gap = '1rem';
                passForm.style.marginTop = '1rem';
                passForm.style.background = 'rgba(255,255,255,0.02)';
                passForm.style.padding = '1.25rem';
                passForm.style.borderRadius = '8px';
                passForm.style.border = '1px solid rgba(255,255,255,0.08)';
                
                passForm.innerHTML = `
                    <div style="text-align: center; margin-bottom: 0.5rem;">
                        <img src="${avatar}" class="avatar" style="width: 60px; height: 60px; margin-bottom: 0.5rem; border-radius: 50%;">
                        <h3 style="margin: 0; font-size: 1.1rem;">${t.Nombre_Completo}</h3>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">${t.Nivel_Acceso}</span>
                    </div>
                    <div class="form-group">
                        <label>Contraseña de Acceso</label>
                        <input type="password" id="switcher-user-password" required placeholder="Ingresa tu contraseña" style="padding: 0.6rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-user-switch" style="padding: 0.5rem 1rem;">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">Confirmar Acceso</button>
                    </div>
                `;
                
                userModal.querySelector('.modal-body').appendChild(passForm);
                
                // Focus on password input
                setTimeout(() => {
                    const pwdInput = document.getElementById('switcher-user-password');
                    if (pwdInput) pwdInput.focus();
                }, 100);
                
                // Cancel button listener
                document.getElementById('btn-cancel-user-switch').addEventListener('click', () => {
                    passForm.remove();
                    usersSelectionGrid.style.display = 'grid';
                    if (introPara) introPara.style.display = 'block';
                });
                
                // Form submit listener
                passForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const enteredPass = document.getElementById('switcher-user-password').value;
                    const realPass = t.Contraseña || '';
                    
                    if (enteredPass === realPass) {
                        setActiveUser(t);
                        passForm.remove();
                        userModal.classList.remove('active');
                        showToast(`Sesión activa como ${t.Nombre_Completo.split(' ')[0]}`, "success");
                        handleRouting();
                    } else {
                        showToast("Contraseña de empleado incorrecta", "error");
                        const pwdInput = document.getElementById('switcher-user-password');
                        if (pwdInput) {
                            pwdInput.value = '';
                            pwdInput.focus();
                        }
                    }
                });
            });
            
            usersSelectionGrid.appendChild(card);
        });
        
        userModal.classList.add('active');
    });
    
    closeUserModal.addEventListener('click', () => {
        userModal.classList.remove('active');
    });
});
