import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  UsageBar,
  useHostTheme,
  useState,
} from "cursor/canvas";

type View = "experience" | "system" | "status";

const journey = [
  {
    label: "Onboarding",
    title: "Empieza con contexto, no con un examen",
    detail:
      "Nombre, nivel, profesión e intereses personalizan el tono sin alterar la dificultad ni las respuestas.",
    meta: "Perfil local",
  },
  {
    label: "Camino",
    title: "16 unidades con una progresión visible",
    detail:
      "La alumna recorre B1 → B2 en 80 sesiones. Cada unidad mezcla vida cotidiana en España, gramática y uso real.",
    meta: "16 unidades · 80 sesiones",
  },
  {
    label: "Sesión",
    title: "Leer, escuchar y actuar",
    detail:
      "Texto editorial, audio con transcripción, ejercicios interactivos y producción libre conviven en el orden del currículo.",
    meta: "356 ejercicios · 15 familias",
  },
  {
    label: "Feedback",
    title: "El error se convierte en explicación",
    detail:
      "Primer fallo: pista. Segundo fallo: explicación y solución. El inglés aparece debajo del español solo como apoyo opcional.",
    meta: "Español primero · inglés bajo demanda",
  },
  {
    label: "Repaso",
    title: "Lo difícil vuelve cuando toca",
    detail:
      "El SRS programa contrastes J y unidades completas con intervalos crecientes, sin backend ni cuenta obligatoria.",
    meta: "2 · 5 · 10 · 21 días",
  },
  {
    label: "Cierre",
    title: "Simulacro DELE y cuaderno final",
    detail:
      "La Unidad 16 cambia al modo examen; el cuaderno reúne producciones, progreso y el recorrido completo.",
    meta: "Diagnóstico · 4 pruebas · cierre",
  },
] as const;

const productAreas = [
  ["Currículo B1→B2", "Completo", "16 unidades, 80 sesiones"],
  ["Motor interactivo", "Completo", "351 ejercicios estructurados"],
  ["Feedback bilingüe", "Completo", "261 ejercicios con apoyo inglés"],
  ["Audio", "Operativo", "Web Speech API + transcripción"],
  ["Repaso espaciado", "Operativo", "Códigos J y unidades"],
  ["Simulacro DELE", "Operativo", "Cronómetro, nota y revisión"],
  ["Persistencia", "Local-first", "IndexedDB + exportación JSON"],
] as const;

export default function NanamiProductCanvas() {
  const theme = useHostTheme();
  const [view, setView] = useState<View>("experience");

  return (
    <Stack
      gap={24}
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: 28,
        color: theme.text.primary,
      }}
    >
      <Hero />

      <Row gap={8} wrap>
        <Pill active={view === "experience"} onClick={() => setView("experience")}>
          Experiencia
        </Pill>
        <Pill active={view === "system"} onClick={() => setView("system")}>
          Sistema
        </Pill>
        <Pill active={view === "status"} onClick={() => setView("status")}>
          Producto
        </Pill>
      </Row>

      {view === "experience" && <ExperienceView />}
      {view === "system" && <SystemView />}
      {view === "status" && <StatusView />}
    </Stack>
  );
}

function Hero() {
  const theme = useHostTheme();

  return (
    <Grid columns="minmax(0, 1.55fr) minmax(260px, 0.85fr)" gap={20} align="stretch">
      <Stack gap={12} style={{ padding: "8px 0" }}>
        <Row gap={8} align="center" wrap>
          <Pill active size="sm">NANAMI</Pill>
          <Text size="small" tone="tertiary">Español en movimiento · B1 → B2</Text>
        </Row>
        <H1>Una app de español que acompaña justo después del error</H1>
        <Text tone="secondary" style={{ maxWidth: 680 }}>
          Diseñada para una adulta japonesa que vive en España: contenido adulto, situaciones reales,
          feedback explicativo y apoyo en inglés sin sustituir nunca el español.
        </Text>
        <Row gap={22} wrap style={{ marginTop: 8 }}>
          <Stat value="16" label="unidades" />
          <Stat value="80" label="sesiones" />
          <Stat value="356" label="ejercicios" />
          <Stat value="B2" label="objetivo" tone="info" />
        </Row>
      </Stack>

      <div
        style={{
          border: `1px solid ${theme.stroke.secondary}`,
          borderRadius: 12,
          background: theme.fill.tertiary,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: 230,
        }}
      >
        <div>
          <Text size="small" tone="tertiary" weight="semibold">
            PRINCIPIO DE PRODUCTO
          </Text>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              margin: "16px 0",
              background: theme.accent.control,
              color: theme.text.onAccent,
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            始
          </div>
          <H3>Seguridad emocional sin rebajar el nivel</H3>
          <Text tone="secondary" size="small">
            La alumna trabaja a nivel B1→B2. La ayuda cambia el momento y la explicación, no la exigencia.
          </Text>
        </div>
        <Text size="small" tone="tertiary">
          Local-first · sin login obligatorio · sin LLM
        </Text>
      </div>
    </Grid>
  );
}

function ExperienceView() {
  const theme = useHostTheme();
  const [selected, setSelected] = useState(3);
  const stage = journey[selected];

  return (
    <Stack gap={28}>
      <section>
        <H2>El recorrido de la alumna</H2>
        <Text tone="secondary">
          Selecciona una etapa para ver cómo encaja en la experiencia completa.
        </Text>

        <Row gap={8} wrap style={{ marginTop: 14 }}>
          {journey.map((item, index) => (
            <span key={item.label} style={{ display: "contents" }}>
              <Pill active={selected === index} onClick={() => setSelected(index)}>
                {index + 1}. {item.label}
              </Pill>
            </span>
          ))}
        </Row>

        <div
          style={{
            marginTop: 16,
            padding: 20,
            borderLeft: `3px solid ${theme.accent.primary}`,
            background: theme.fill.quaternary,
          }}
        >
          <Text size="small" tone="tertiary" weight="semibold">{stage.meta}</Text>
          <H3 style={{ marginTop: 6 }}>{stage.title}</H3>
          <Text tone="secondary" style={{ maxWidth: 760 }}>{stage.detail}</Text>
        </div>
      </section>

      <Divider />

      <Grid columns="minmax(0, 1.2fr) minmax(280px, 0.8fr)" gap={24} align="start">
        <section>
          <H2>El momento clave: fallar bien</H2>
          <Text tone="secondary">
            El motor mantiene una máquina de estados pequeña y visible. No penaliza con ruido: añade
            ayuda de forma gradual.
          </Text>
          <FlowStrip />
        </section>

        <Card size="lg">
          <CardHeader trailing={<Pill size="sm" active>Contextual</Pill>}>
            Apoyo lingüístico
          </CardHeader>
          <CardBody>
            <Stack gap={12}>
              <Text>
                <Text weight="semibold">Español:</Text> siempre es la fuente principal del feedback.
              </Text>
              <Text>
                <Text weight="semibold">English:</Text> aparece debajo, solo si existe una versión revisada.
              </Text>
              <Text>
                <Text weight="semibold">Modo DELE:</Text> elimina el apoyo durante el simulacro.
              </Text>
              <Callout tone="info" title="La ayuda vive donde ocurre el fallo">
                No obliga a volver al principio de la sesión para encontrar un interruptor.
              </Callout>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <section>
        <H2>Cobertura del motor</H2>
        <UsageBar
          total={356}
          topLeftLabel="351 ejercicios interactivos"
          topRightLabel="5 cierres/revisión DELE sin motor"
          segments={[{ id: "motor", value: 351, color: "green" }]}
        />
        <Text size="small" tone="tertiary" style={{ marginTop: 8 }}>
          Los cinco restantes pertenecen a revisión, informe, proyecto y plan final de la Unidad 16; no
          contienen una clave que deba ocultarse.
        </Text>
      </section>
    </Stack>
  );
}

function FlowStrip() {
  const theme = useHostTheme();
  const steps = [
    ["Intento", "La alumna responde"],
    ["Fallo 1", "Pista breve"],
    ["Fallo 2", "Explicación + solución"],
    ["Después", "SRS si corresponde"],
  ];

  return (
    <Grid columns={4} gap={8} style={{ marginTop: 16 }}>
      {steps.map(([title, detail], index) => (
        <div
          key={title}
          style={{
            padding: 12,
            borderTop: `2px solid ${index === 2 ? theme.accent.primary : theme.stroke.primary}`,
            background: index === 2 ? theme.fill.tertiary : "transparent",
          }}
        >
          <Text size="small" weight="semibold">{title}</Text>
          <Text size="small" tone="tertiary">{detail}</Text>
        </div>
      ))}
    </Grid>
  );
}

function SystemView() {
  return (
    <Stack gap={28}>
      <section>
        <H2>De currículo editorial a producto interactivo</H2>
        <Text tone="secondary">
          El contenido permanece como fuente de verdad. El producto lo estructura sin simplificarlo.
        </Text>
        <SystemFlow />
      </section>

      <Grid columns={2} gap={20} align="start">
        <Card>
          <CardHeader>Motor de aprendizaje</CardHeader>
          <CardBody>
            <Stack gap={10}>
              <SystemRow label="Estado" value="useReducer: idle → fallo_1 → fallo_2 / correcto" />
              <SystemRow label="Validación" value="Funciones puras por tipo de ejercicio" />
              <SystemRow label="Audio" value="Web Speech API, voz y pitch por personaje" />
              <SystemRow label="Repaso" value="SRS por códigos J y por unidad" />
              <SystemRow label="Producción" value="Role-play, escritura, oral y rúbrica" />
            </Stack>
          </CardBody>
        </Card>

        <section>
          <H2>Local-first por diseño</H2>
          <Text tone="secondary">
            La primera versión no necesita cuenta, servidor propio ni conexión permanente.
          </Text>
          <Stack gap={12} style={{ marginTop: 16 }}>
            <Callout tone="success" title="IndexedDB">
              Progreso, intentos, respuestas y tarjetas de repaso.
            </Callout>
            <Callout tone="neutral" title="localStorage">
              Perfil, preferencia de apoyo inglés y fecha de copia.
            </Callout>
            <Callout tone="info" title="Exportar / importar JSON">
              La usuaria controla su copia y puede moverla a otro navegador.
            </Callout>
          </Stack>
        </section>
      </Grid>

      <section>
        <H2>Stack real</H2>
        <Row gap={8} wrap>
          {["Next.js 15", "React 19", "TypeScript", "CSS Modules", "IndexedDB", "Web Speech API", "pnpm"].map(
            (item) => (
              <span key={item} style={{ display: "contents" }}>
                <Pill>{item}</Pill>
              </span>
            )
          )}
        </Row>
      </section>
    </Stack>
  );
}

function SystemFlow() {
  const theme = useHostTheme();
  const nodes = [
    ["Contenido", "curriculo-b1-b2.md"],
    ["Parser", "Ejercicios tipados"],
    ["Datos", "JSON por unidad"],
    ["Producto", "Next + React"],
    ["Estado", "IndexedDB local"],
  ];

  return (
    <Grid columns={5} gap={10} style={{ marginTop: 18 }}>
      {nodes.map(([title, detail], index) => (
        <div
          key={title}
          style={{
            minHeight: 94,
            padding: 12,
            border: `1px solid ${index === 3 ? theme.accent.primary : theme.stroke.secondary}`,
            borderRadius: 8,
            background: index === 3 ? theme.fill.tertiary : theme.bg.editor,
            position: "relative",
          }}
        >
          <Text size="small" tone="tertiary">{String(index + 1).padStart(2, "0")}</Text>
          <Text weight="semibold">{title}</Text>
          <Text size="small" tone="secondary">{detail}</Text>
        </div>
      ))}
    </Grid>
  );
}

function SystemRow({ label, value }: { label: string; value: string }) {
  return (
    <Grid columns="90px 1fr" gap={10}>
      <Text size="small" tone="tertiary" weight="semibold">{label}</Text>
      <Text size="small">{value}</Text>
    </Grid>
  );
}

function StatusView() {
  return (
    <Stack gap={26}>
      <Callout tone="success" title="MVP B1→B2 cerrado">
        Las 16 unidades, el motor, audio, SRS, producción, simulacro DELE y cuaderno final forman ya un
        recorrido completo.
      </Callout>

      <Grid columns="minmax(0, 1.45fr) minmax(260px, 0.55fr)" gap={22} align="start">
        <section>
          <H2>Mapa de capacidades</H2>
          <Table
            headers={["Área", "Estado", "Alcance"]}
            rows={productAreas.map((row) => [...row])}
            rowTone={["success", "success", "success", "info", "info", "success", "info"]}
            striped
          />
        </section>

        <Stack gap={18}>
          <section>
            <H2>Decisiones V1</H2>
            <Stack gap={8}>
              <Text size="small">Sin login obligatorio</Text>
              <Text size="small">Sin backend propio</Text>
              <Text size="small">Sin CMS</Text>
              <Text size="small">Sin LLM para corregir</Text>
              <Text size="small">Sin promesa de acento regional</Text>
            </Stack>
          </section>
          <Divider />
          <section>
            <H2>Siguiente frontera</H2>
            <Text tone="secondary" size="small">
              Operación y despliegue, prueba real en Safari/iOS y, fuera del MVP, expansión a otros niveles MCER.
            </Text>
          </section>
        </Stack>
      </Grid>
    </Stack>
  );
}
