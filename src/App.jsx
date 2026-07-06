import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabase'

function App() {
  const [sesiones, setSesiones] = useState([])
  const [admin, setAdmin] = useState(false)
  const [sesionAbierta, setSesionAbierta] = useState(null)
  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [tema, setTema] = useState("")
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [sesionEditando, setSesionEditando] = useState(null)
const [editarFecha, setEditarFecha] = useState("")
const [editarPonente, setEditarPonente] = useState("")
const [editarTema, setEditarTema] = useState("")

  async function cargarSesiones() {
    const { data, error } = await supabase
      .from("sesiones")
      .select("*")
      .order("fecha")

    if (error) {
      console.error(error)
      return
    }

    setSesiones(data)
  }

  useEffect(() => {
    cargarSesiones()
  }, [])

  const meses = [
    ...new Set(
      sesiones.map((sesion) =>
        new Date(sesion.fecha).toLocaleDateString("es-ES", {
          month: "long",
        }).toUpperCase()
      )
    ),
  ]

  const normalizarTexto = (texto) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

  const temasSimilares = sesiones.filter(
    (s) =>
      s.tema &&
      tema.trim().length >= 3 &&
      normalizarTexto(s.tema).includes(normalizarTexto(tema))
  )

  return (
<div className="app">
  <h1>Sesiones Docentes Urgencias</h1>
  <h2>Servicio de Urgencias</h2>

  <p className="intro">
    Reserva una sesión haciendo clic sobre una fecha disponible.
  </p>

  <div className="aviso">
    <strong>⚠️ IMPORTANTE</strong>
    <p>
      Una vez confirmada la reserva, la fecha quedará bloqueada y no podrá
      modificarse desde la aplicación.
    </p>
  </div>
<div style={{ textAlign: "right", marginBottom: "20px" }}>
  <button
  className="boton-admin"
  onClick={() => {
    if (admin) {
      setAdmin(false)
      return
    }

    const clave = prompt("Introduce la contraseña de administrador")

    if (clave === import.meta.env.VITE_ADMIN_PASSWORD) {
      setAdmin(true)
    } else {
      alert("Contraseña incorrecta")
    }
  }}
>
  {admin ? "Salir del modo administrador" : "Modo administrador"}
</button>
</div>
{admin && (
  <div className="panel-admin">
    <h3>🛠 Panel de administración</h3>

    <label>Fecha de la nueva sesión</label>

    <input
      type="date"
      value={nuevaFecha}
      onChange={(e) => setNuevaFecha(e.target.value)}
    />

   <button
  className="boton-confirmar"
  onClick={async () => {
    if (!nuevaFecha) {
      alert("Selecciona una fecha.")
      return
    }

    const yaExiste = sesiones.some(
  (s) => s.fecha === nuevaFecha
)

if (yaExiste) {
  alert("Ya existe una sesión programada para esa fecha.")
  return
}
    const { error } = await supabase
      .from("sesiones")
      .insert({
        fecha: nuevaFecha,
        reservada: false,
      })

    if (error) {
  console.error(error)
  alert(JSON.stringify(error))
  return
}

    await cargarSesiones()
    setNuevaFecha("")
  }}
>
  Crear sesión
</button>

    <hr />

    <h4>Estadísticas</h4>

    <p>Sesiones totales: {sesiones.length}</p>

    <p>
      Disponibles: {sesiones.filter((s) => !s.reservada).length}
    </p>

    <p>
      Reservadas: {sesiones.filter((s) => s.reservada).length}
    </p>
  </div>
)}

<h3>Próximas sesiones</h3>

{meses.map((mes) => (
  <div key={mes}>

    <h3>{mes}</h3>

    {sesiones
      .filter(
  (sesion) =>
    new Date(sesion.fecha).toLocaleDateString("es-ES", {
      month: "long",
    }).toUpperCase() === mes
)
      .map((sesion) => (
        <div
  className={`tarjeta ${!sesion.reservada ? "disponible" : "reservada"}`}
  key={sesion.fecha}
>

<h4>
  {new Date(sesion.fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}
</h4>

<div className={!sesion.reservada ? "estado disponible-badge" : "estado reservada-badge"}>
  {!sesion.reservada ? "DISPONIBLE" : "RESERVADA"}
</div>
{!sesion.reservada && (
  <>
    <button
      className="boton-reservar"
      onClick={() =>
        setSesionAbierta(
          sesionAbierta === sesion.id ? null : sesion.id
        )
      }
    >
      Reservar
    </button>

    {admin && (
      <button
        className="boton-confirmar"
        style={{
          marginLeft: "10px",
          backgroundColor: "#666",
        }}
        onClick={async () => {
          if (!confirm("¿Seguro que deseas eliminar esta sesión?")) {
            return
          }

          const { error } = await supabase
            .from("sesiones")
            .delete()
            .eq("id", sesion.id)

          if (error) {
            alert(JSON.stringify(error))
            return
          }

          await cargarSesiones()
        }}
      >
        Eliminar
      </button>
    )}

    {sesionAbierta === sesion.id && (
<form className="formulario">

  <label htmlFor="nombre">Nombre y apellidos</label>
  <input
    id="nombre"
    type="text"
    autoComplete="off"
    value={nombre}
    onChange={(e) => setNombre(e.target.value)}
  />

  <label htmlFor="correo">Correo electrónico</label>
  <input
    id="correo"
    type="email"
    autoComplete="off"
    value={correo}
    onChange={(e) => setCorreo(e.target.value)}
  />

  <label htmlFor="tema">Tema</label>
  <input
    id="tema"
    type="text"
    autoComplete="off"
    value={tema}
    onChange={(e) => setTema(e.target.value)}
  />
{temasSimilares.length > 0 && (
  <div className="temas-similares">
    <strong>🟡 Ya existen sesiones con un título similar:</strong>

    <ul>
      {temasSimilares.map((s) => (
        <li key={s.fecha}>{s.tema}</li>
      ))}
    </ul>
  </div>
)}
<div className="confirmacion">

<h4>⚠️ Importante</h4>

<p>
  Una vez confirmada la reserva, la fecha quedará bloqueada y no podrá modificarse desde la aplicación.
</p>

  <button
  type="button"
  className="boton-confirmar"
  onClick={async () => {

  if (!nombre.trim()) {
    alert("Introduce tu nombre y apellidos.")
    return
  }

  if (!correo.trim()) {
    alert("Introduce tu correo electrónico.")
    return
  }

  if (!correo.includes("@")) {
    alert("Introduce un correo electrónico válido.")
    return
  }

  if (!tema.trim()) {
    alert("Introduce el tema de la sesión.")
    return
  }

const { error } = await supabase
  .from("sesiones")
  .update({
    ponente: nombre,
    correo: correo,
    tema: tema,
    reservada: true,
    fecha_reserva: new Date().toISOString(),
  })
  .eq("id", sesion.id)

if (error) {
  console.error(error)
  alert(JSON.stringify(error))
  return
}

  await cargarSesiones()

  setSesionAbierta(null)
  setNombre("")
  setCorreo("")
  setTema("")
  }}
>
  Confirmar reserva
</button>

</div>

</form>
)}
</>
)}
          {sesion.reservada && (
  <>
    <p><strong>Ponente:</strong> {sesion.ponente}</p>
    <p><strong>Tema:</strong> {sesion.tema}</p>

{sesionEditando === sesion.id && (
  <div className="formulario" style={{ marginTop: "15px" }}>
    <label>Fecha</label>
    <input
      type="date"
      value={editarFecha}
      onChange={(e) => setEditarFecha(e.target.value)}
    />

    <label>Ponente</label>
    <input
      type="text"
      value={editarPonente}
      onChange={(e) => setEditarPonente(e.target.value)}
    />

    <label>Tema</label>
    <input
      type="text"
      value={editarTema}
      onChange={(e) => setEditarTema(e.target.value)}
    />
  </div>
)}
    {admin && (
  <>
    <>
  <button
    className="boton-confirmar"
    style={{
      marginTop: "15px",
      marginRight: "10px",
      backgroundColor: "#1976d2",
    }}
    onClick={async () => {
      if (sesionEditando === sesion.id) {
        const { error } = await supabase
          .from("sesiones")
          .update({
            fecha: editarFecha,
            ponente: editarPonente,
            tema: editarTema,
          })
          .eq("id", sesion.id)

        if (error) {
          alert(JSON.stringify(error))
          return
        }

        await cargarSesiones()

        setSesionEditando(null)
        setEditarFecha("")
        setEditarPonente("")
        setEditarTema("")
      } else {
        setSesionEditando(sesion.id)
        setEditarFecha(sesion.fecha)
        setEditarPonente(sesion.ponente || "")
        setEditarTema(sesion.tema || "")
      }
    }}
  >
    {sesionEditando === sesion.id ? "Guardar cambios" : "Editar"}
  </button>

  {sesionEditando === sesion.id && (
    <button
      className="boton-confirmar"
      style={{
        marginTop: "15px",
        marginLeft: "10px",
        backgroundColor: "#777",
      }}
      onClick={() => {
        setSesionEditando(null)
        setEditarFecha("")
        setEditarPonente("")
        setEditarTema("")
      }}
    >
      Cancelar
    </button>
  )}
</>

    <button
      className="boton-confirmar"
      style={{ marginTop: "15px", backgroundColor: "#c62828" }}
      onClick={async () => {
    if (!confirm("¿Seguro que deseas cancelar esta reserva?")) {
      return
    }

    const { error } = await supabase
      .from("sesiones")
      .update({
        reservada: false,
        ponente: null,
        correo: null,
        tema: null,
        fecha_reserva: null,
      })
      .eq("id", sesion.id)

    if (error) {
      alert(JSON.stringify(error))
      return
    }

    await cargarSesiones()
  }}
>
  Cancelar reserva
</button>

  </>
)}

  </>
)}

        </div>
      ))}

  </div>
))}



</div>
  )
}
export default App