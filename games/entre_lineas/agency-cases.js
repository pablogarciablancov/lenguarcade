const AGENCY_CASES=[
  {
    "id": "agency_manuscrito",
    "number": "MANUSCRITO",
    "title": "El último acto",
    "place": "Teatro Aurora",
    "difficulty": "Relaciones temporales",
    "objective": "El desenlace de la obra ha desaparecido del archivo. Determina quién lo retiró antes del ensayo.",
    "xp": 120,
    "agency": true,
    "docs": [
      {
        "id": "d0",
        "title": "Orden de investigación",
        "type": "Expediente",
        "body": "<h2>El último acto</h2><p>El desenlace de la obra ha desaparecido del archivo. Determina quién lo retiró antes del ensayo.</p><p>Interroga a las seis personas. Abre los documentos y archiva las frases que puedan servir como pruebas. Relaciona las fuentes y presenta dos pruebas independientes.</p>"
      },
      {
        "id": "d1",
        "title": "Registro de acceso",
        "type": "Prueba documental",
        "body": "<h2>Registro de acceso</h2><p>El archivo solo se abrió entre las 17:40 y las 18:00 con la tarjeta personal de Bruno. Las tarjetas no se prestaron y el acceso quedó grabado.</p>"
      },
      {
        "id": "d2",
        "title": "Inventario sellado",
        "type": "Prueba documental",
        "body": "<h2>Inventario sellado</h2><p>A las 17:40 el manuscrito estaba en el archivo. A las 18:00 ya faltaba. La grabación confirma que solo entró una persona durante ese intervalo.</p>"
      },
      {
        "id": "d3",
        "title": "Programa de ensayo",
        "type": "Prueba documental",
        "body": "<h2>Programa de ensayo</h2><p>La campana sonó a las 18:00. Vera entró a las 18:05.</p>"
      },
      {
        "id": "d4",
        "title": "Nota de vestuario",
        "type": "Prueba documental",
        "body": "<h2>Nota de vestuario</h2><p>La carpeta que llevaba Bruno era azul. En el teatro se utilizan muchas carpetas azules.</p>"
      }
    ],
    "people": [
      {
        "id": "p0",
        "name": "Vera",
        "role": "Directora",
        "initial": "Entré en el archivo después de la campana de las seis.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Entré en el archivo después de la campana de las seis."
          }
        ]
      },
      {
        "id": "p1",
        "name": "Bruno",
        "role": "Tramoyista",
        "initial": "No fui al archivo antes de las seis.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "No fui al archivo antes de las seis."
          }
        ]
      },
      {
        "id": "p2",
        "name": "Celia",
        "role": "Actriz",
        "initial": "Vi a Vera junto al archivo, pero ya había sonado la campana.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Vi a Vera junto al archivo, pero ya había sonado la campana."
          }
        ]
      },
      {
        "id": "p3",
        "name": "Darío",
        "role": "Técnico",
        "initial": "Permanecí con Celia en el escenario entre las cinco y las seis.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Permanecí con Celia en el escenario entre las cinco y las seis."
          }
        ]
      },
      {
        "id": "p4",
        "name": "Elena",
        "role": "Archivera",
        "initial": "Cerré el archivo a las seis; el manuscrito ya no estaba.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Cerré el archivo a las seis; el manuscrito ya no estaba."
          }
        ]
      },
      {
        "id": "p5",
        "name": "Félix",
        "role": "Músico",
        "initial": "Bruno llevaba una carpeta; no pude ver su contenido.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Bruno llevaba una carpeta; no pude ver su contenido."
          }
        ]
      }
    ],
    "clues": [
      {
        "id": "c0",
        "doc": "d1",
        "text": "El archivo solo se abrió entre las 17:40 y las 18:00 con la tarjeta personal de Bruno. Las tarjetas no se prestaron y el acceso quedó grabado.",
        "important": true,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c1",
        "doc": "d2",
        "text": "A las 17:40 el manuscrito estaba en el archivo. A las 18:00 ya faltaba. La grabación confirma que solo entró una persona durante ese intervalo.",
        "important": true,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c2",
        "doc": "d3",
        "text": "La campana sonó a las 18:00. Vera entró a las 18:05.",
        "important": false,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c3",
        "doc": "d4",
        "text": "La carpeta que llevaba Bruno era azul. En el teatro se utilizan muchas carpetas azules.",
        "important": false,
        "kind": "Documento",
        "skill": "inference"
      }
    ],
    "keyConnections": [
      {
        "a": "c0",
        "b": "c1",
        "rel": "confirma"
      }
    ],
    "tasks": [
      {
        "id": "t0",
        "title": "Conclusión del expediente",
        "q": "¿Qué permite sostener una acusación?",
        "options": [
          "Una sospecha sobre el carácter de alguien.",
          "Dos fuentes independientes que relacionan los hechos y la persona.",
          "La persona que parece más nerviosa."
        ],
        "correct": 1,
        "skill": "analysis"
      }
    ],
    "solution": {
      "responsible": "p1",
      "proofs": [
        "c0",
        "c1"
      ],
      "what": "Bruno retiró el manuscrito durante el único acceso del intervalo. El inventario fija cuándo desapareció y el registro identifica a quien entró. La visita posterior de Vera no demuestra responsabilidad.",
      "redHerring": "p0"
    }
  },
  {
    "id": "agency_titular",
    "number": "TITULAR",
    "title": "La noticia que nunca fue",
    "place": "Redacción El Faro",
    "difficulty": "Hechos y opiniones",
    "objective": "Una noticia publicada cambia el sentido de una entrevista. Identifica quién introdujo la modificación.",
    "xp": 120,
    "agency": true,
    "docs": [
      {
        "id": "d0",
        "title": "Orden de investigación",
        "type": "Expediente",
        "body": "<h2>La noticia que nunca fue</h2><p>Una noticia publicada cambia el sentido de una entrevista. Identifica quién introdujo la modificación.</p><p>Interroga a las seis personas. Abre los documentos y archiva las frases que puedan servir como pruebas. Relaciona las fuentes y presenta dos pruebas independientes.</p>"
      },
      {
        "id": "d1",
        "title": "Historial de edición",
        "type": "Prueba documental",
        "body": "<h2>Historial de edición</h2><p>A las 12:08 la cuenta personal de Inés sustituyó «no está cerrado» por «está cerrado». Las cuentas son individuales y el registro de sesión confirma su identidad.</p>"
      },
      {
        "id": "d2",
        "title": "Entrevista original",
        "type": "Prueba documental",
        "body": "<h2>Entrevista original</h2><p>La grabación dice: «El puente no está cerrado; solo se limita el paso a camiones». El borrador guardado a las 12:07 conserva esa frase.</p>"
      },
      {
        "id": "d3",
        "title": "Fotografía",
        "type": "Prueba documental",
        "body": "<h2>Fotografía</h2><p>La imagen muestra una barrera para camiones. No permite concluir que esté cerrado para todos.</p>"
      },
      {
        "id": "d4",
        "title": "Columna de opinión",
        "type": "Prueba documental",
        "body": "<h2>Columna de opinión</h2><p>Óscar escribió: «Creo que esta redacción necesita más rigor». Es una valoración, no un registro de edición.</p>"
      }
    ],
    "people": [
      {
        "id": "p0",
        "name": "Alba",
        "role": "Reportera",
        "initial": "Mi original decía que el puente no estaba cerrado.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Mi original decía que el puente no estaba cerrado."
          }
        ]
      },
      {
        "id": "p1",
        "name": "Nico",
        "role": "Fotógrafo",
        "initial": "La fotografía es del martes, no de hoy.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "La fotografía es del martes, no de hoy."
          }
        ]
      },
      {
        "id": "p2",
        "name": "Inés",
        "role": "Editora",
        "initial": "Solo cambié la tipografía; no toqué las palabras.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Solo cambié la tipografía; no toqué las palabras."
          }
        ]
      },
      {
        "id": "p3",
        "name": "Leo",
        "role": "Becario",
        "initial": "Envié el borrador a Inés antes de publicarlo.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Envié el borrador a Inés antes de publicarlo."
          }
        ]
      },
      {
        "id": "p4",
        "name": "Mara",
        "role": "Correctora",
        "initial": "Revisé la entrevista original, no la versión publicada.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Revisé la entrevista original, no la versión publicada."
          }
        ]
      },
      {
        "id": "p5",
        "name": "Óscar",
        "role": "Director",
        "initial": "Me parece que Alba exagera a menudo.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Me parece que Alba exagera a menudo."
          }
        ]
      }
    ],
    "clues": [
      {
        "id": "c0",
        "doc": "d1",
        "text": "A las 12:08 la cuenta personal de Inés sustituyó «no está cerrado» por «está cerrado». Las cuentas son individuales y el registro de sesión confirma su identidad.",
        "important": true,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c1",
        "doc": "d2",
        "text": "La grabación dice: «El puente no está cerrado; solo se limita el paso a camiones». El borrador guardado a las 12:07 conserva esa frase.",
        "important": true,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c2",
        "doc": "d3",
        "text": "La imagen muestra una barrera para camiones. No permite concluir que esté cerrado para todos.",
        "important": false,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c3",
        "doc": "d4",
        "text": "Óscar escribió: «Creo que esta redacción necesita más rigor». Es una valoración, no un registro de edición.",
        "important": false,
        "kind": "Documento",
        "skill": "inference"
      }
    ],
    "keyConnections": [
      {
        "a": "c0",
        "b": "c1",
        "rel": "confirma"
      }
    ],
    "tasks": [
      {
        "id": "t0",
        "title": "Conclusión del expediente",
        "q": "¿Qué permite sostener una acusación?",
        "options": [
          "Una sospecha sobre el carácter de alguien.",
          "Dos fuentes independientes que relacionan los hechos y la persona.",
          "La persona que parece más nerviosa."
        ],
        "correct": 1,
        "skill": "analysis"
      }
    ],
    "solution": {
      "responsible": "p2",
      "proofs": [
        "c0",
        "c1"
      ],
      "what": "Inés eliminó la negación y cambió el sentido de la información. El historial identifica la modificación y la entrevista permite comprobar la tergiversación. Una opinión sobre Alba no prueba que ella modificara el texto.",
      "redHerring": "p0"
    }
  },
  {
    "id": "agency_telon",
    "number": "TELON",
    "title": "Cinco minutos de silencio",
    "place": "Sala del Reloj",
    "difficulty": "Referencias e inferencias",
    "objective": "Alguien sustituyó la orden de sonido y dejó el estreno sin música. Reconstruye quién cambió la instrucción.",
    "xp": 120,
    "agency": true,
    "docs": [
      {
        "id": "d0",
        "title": "Orden de investigación",
        "type": "Expediente",
        "body": "<h2>Cinco minutos de silencio</h2><p>Alguien sustituyó la orden de sonido y dejó el estreno sin música. Reconstruye quién cambió la instrucción.</p><p>Interroga a las seis personas. Abre los documentos y archiva las frases que puedan servir como pruebas. Relaciona las fuentes y presenta dos pruebas independientes.</p>"
      },
      {
        "id": "d1",
        "title": "Acta de entrega",
        "type": "Prueba documental",
        "body": "<h2>Acta de entrega</h2><p>Iria y Nora firmaron que el sobre llevaba «Reproducir pista 3». Iria lo cerró con un sello numerado y lo entregó a Mateo. Él fue su único custodio hasta entregarlo a Nora.</p>"
      },
      {
        "id": "d2",
        "title": "Recepción en cabina",
        "type": "Prueba documental",
        "body": "<h2>Recepción en cabina</h2><p>Nora e Iria registraron juntas que el mismo sobre llegó con el sello roto y una hoja distinta: «Mantener silencio». Mateo confirmó que nadie más lo había tocado.</p>"
      },
      {
        "id": "d3",
        "title": "Conversación",
        "type": "Prueba documental",
        "body": "<h2>Conversación</h2><p>Joel escribió: «Lara me dijo que ella había preparado la música». «Ella» se refiere a Lara; preparar la pieza no implica cambiar la orden.</p>"
      },
      {
        "id": "d4",
        "title": "Plano de sala",
        "type": "Prueba documental",
        "body": "<h2>Plano de sala</h2><p>Hugo y Joel podían ver la puerta de la cabina, pero no el contenido de los sobres.</p>"
      }
    ],
    "people": [
      {
        "id": "p0",
        "name": "Hugo",
        "role": "Actor",
        "initial": "Vi a Mateo llevar un sobre a la cabina.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Vi a Mateo llevar un sobre a la cabina."
          }
        ]
      },
      {
        "id": "p1",
        "name": "Iria",
        "role": "Regidora",
        "initial": "Entregué a Mateo un sobre cerrado con la orden correcta.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Entregué a Mateo un sobre cerrado con la orden correcta."
          }
        ]
      },
      {
        "id": "p2",
        "name": "Joel",
        "role": "Iluminador",
        "initial": "Lara me dijo que ella había preparado la música.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Lara me dijo que ella había preparado la música."
          }
        ]
      },
      {
        "id": "p3",
        "name": "Lara",
        "role": "Compositora",
        "initial": "Compuse la pieza, pero no entré en la cabina.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Compuse la pieza, pero no entré en la cabina."
          }
        ]
      },
      {
        "id": "p4",
        "name": "Mateo",
        "role": "Ayudante",
        "initial": "Transporté el sobre sin abrirlo; nadie más lo tuvo.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Transporté el sobre sin abrirlo; nadie más lo tuvo."
          }
        ]
      },
      {
        "id": "p5",
        "name": "Nora",
        "role": "Técnica de sonido",
        "initial": "Abrí el sobre delante de Iria y encontré la orden de silencio.",
        "questions": [
          {
            "q": "¿Qué puedes declarar?",
            "a": "Abrí el sobre delante de Iria y encontré la orden de silencio."
          }
        ]
      }
    ],
    "clues": [
      {
        "id": "c0",
        "doc": "d1",
        "text": "Iria y Nora firmaron que el sobre llevaba «Reproducir pista 3». Iria lo cerró con un sello numerado y lo entregó a Mateo. Él fue su único custodio hasta entregarlo a Nora.",
        "important": true,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c1",
        "doc": "d2",
        "text": "Nora e Iria registraron juntas que el mismo sobre llegó con el sello roto y una hoja distinta: «Mantener silencio». Mateo confirmó que nadie más lo había tocado.",
        "important": true,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c2",
        "doc": "d3",
        "text": "Joel escribió: «Lara me dijo que ella había preparado la música». «Ella» se refiere a Lara; preparar la pieza no implica cambiar la orden.",
        "important": false,
        "kind": "Documento",
        "skill": "inference"
      },
      {
        "id": "c3",
        "doc": "d4",
        "text": "Hugo y Joel podían ver la puerta de la cabina, pero no el contenido de los sobres.",
        "important": false,
        "kind": "Documento",
        "skill": "inference"
      }
    ],
    "keyConnections": [
      {
        "a": "c0",
        "b": "c1",
        "rel": "confirma"
      }
    ],
    "tasks": [
      {
        "id": "t0",
        "title": "Conclusión del expediente",
        "q": "¿Qué permite sostener una acusación?",
        "options": [
          "Una sospecha sobre el carácter de alguien.",
          "Dos fuentes independientes que relacionan los hechos y la persona.",
          "La persona que parece más nerviosa."
        ],
        "correct": 1,
        "skill": "analysis"
      }
    ],
    "solution": {
      "responsible": "p4",
      "proofs": [
        "c0",
        "c1"
      ],
      "what": "Mateo sustituyó la instrucción durante su custodia exclusiva. Las actas comparan el contenido de salida y llegada del mismo sobre. Que Lara preparase la música no la vincula a la sustitución.",
      "redHerring": "p0"
    }
  }
];
