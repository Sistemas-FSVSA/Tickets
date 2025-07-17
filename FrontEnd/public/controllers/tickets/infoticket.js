document.addEventListener("DOMContentLoaded", function () {
  const url = window.env.API_URL;

  const form = document.getElementById("followform");
  const ticketInfoDiv = document.getElementById("ticket-info");
  const anotherTicketContainer = document.getElementById("another-ticket-container");
  const ticketInput = document.getElementById("ticket");
  const emailInput = document.getElementById("email");

  function formatearFecha(fecha) {
    if (!fecha) return "";
    const dateObj = new Date(fecha);
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getUTCDate()).padStart(2, "0");
    let hours = dateObj.getUTCHours();
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
    const isPM = hours >= 12;
    hours = hours % 12;
    hours = hours ? String(hours).padStart(2, "0") : "12";
    const period = isPM ? "PM" : "AM";
    return `${year}-${month}-${day} ${hours}:${minutes} ${period}`;
  }

  if (ticketInput) {
    ticketInput.addEventListener("keydown", function (e) {
      if (
        (e.key >= "0" && e.key <= "9") ||
        e.key === "Backspace" ||
        e.key === "Tab" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Delete" ||
        e.key === "Enter"
      ) {
        return;
      } else {
        e.preventDefault();
      }
    });
  }

  form.onsubmit = function (e) {
    e.preventDefault();
    const idticket = ticketInput.value.trim();
    const email = emailInput.value.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({
        title: "Error",
        text: "Por favor, ingresa un correo válido.",
        icon: "error",
      });
      return;
    }

    fetch(`${url}/api/tickets/obtenerInfoTickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idticket, email }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.estado === "ok") {
          const ticket = result.ticket;
          form.querySelector('button[type="submit"]').style.display = "none";
          ticketInfoDiv.style.display = "flex";

          const fechaFormateada = formatearFecha(ticket.fechainicio);

          // ✅ Validar observaciones
          const observacionMostrada =
            ticket.observacion && ticket.observacion.trim() !== ""
              ? ticket.observacion
              : "El ticket aún no ha sido gestionado";

          const detalleMostrado =
            ticket.detalle && ticket.detalle.trim() !== ""
              ? ticket.detalle
              : "No le fueron proporcionados detalles a este ticket.";

          ticketInfoDiv.innerHTML = `
            <div class="col">
                <p><strong>Correo:</strong> ${ticket.correo}</p>
                <p><strong>Dependencia:</strong> ${ticket.dependencia}</p>
                <p><strong>Extensión:</strong> ${ticket.ext}</p>
            </div> 
            <div class="col">
                <p><strong>Tema:</strong> ${ticket.tema}</p>
                <p><strong>Subtema:</strong> ${ticket.subtema}</p>
            </div>
            <div>
                <p><strong>Detalle:</strong> ${detalleMostrado}</p>
            </div>
            <div class="col-12 mt-4" id="timeline">
                ${crearLineaProgreso(ticket)}
                <div class="d-flex justify-content-between align-items-center px-4">
                    ${crearPaso("enviado", "fa-envelope", "ENVIADO", formatearFecha(ticket.fechainicio))}
                    ${crearPaso("visto", "fa-eye", "VISTO", formatearFecha(ticket.fechaleido))}
                    ${crearPaso("gestionado-cerrado", "fa-check", "GESTIONADO/CERRADO", formatearFecha(ticket.fechacierre))}
                </div>
            </div>
            <div class="col">
              <p class="observacion-texto"><strong>Observaciones:</strong> ${observacionMostrada}</p>
            </div>
          `;

          anotherTicketContainer.style.display = "block";
          ticketInput.disabled = true;
          emailInput.disabled = true;
        } else {
          Swal.fire({
            title: "Error",
            text: result.mensaje || "No se encontró el ticket.",
            icon: "error",
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Swal.fire({
          title: "Error",
          text: "Hubo un error al procesar la solicitud.",
          icon: "error",
        });
      });
  };

  function crearPaso(id, iconClass, titulo, fecha) {
    const isActivo = fecha !== null && fecha !== undefined && fecha !== "";
    const dotClass = isActivo ? "dot active" : "dot";
    const fechaHTML = isActivo ? `<div><small>${fecha}</small></div>` : "";
    return `
    <div class="step">
      <div class="${dotClass}"><span class="icon"><i class="fas ${iconClass}"></i></span></div>
      <small>${titulo}</small>
      ${fechaHTML}
    </div>
  `;
  }



  function crearLineaProgreso(ticket) {
    let porcentaje = 0;
    if (ticket.fechainicio) porcentaje += 33.33;
    if (ticket.fechaleido) porcentaje += 33.33;
    if (ticket.fechacierre) porcentaje = 100;

    return `
    <div class="progress-track">
      <div class="progress-bar-fill" style="width: ${porcentaje}%"></div>
    </div>
  `;
  }


  function resetForm() {
    form.reset();
    ticketInput.disabled = false;
    emailInput.disabled = false;
    ticketInfoDiv.style.display = "none";
    ticketInfoDiv.innerHTML = "";
    anotherTicketContainer.style.display = "none";
    form.querySelector('button[type="submit"]').style.display = "block";
  }

  function refrescarTicket() {
    const idticket = ticketInput.value.trim();
    const email = emailInput.value.trim();

    if (!idticket || !email) return;

    fetch(`${url}/api/tickets/obtenerInfoTickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idticket, email }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.estado === "ok") {
          const ticket = result.ticket;
          const fechaFormateada = formatearFecha(ticket.fechainicio);

          // ✅ Validar observaciones
          const observacionMostrada =
            ticket.observacion && ticket.observacion.trim() !== ""
              ? ticket.observacion
              : "El ticket aún no ha sido gestionado";

          ticketInfoDiv.innerHTML = `
          <div class="col">
              <p><strong>Correo:</strong> ${ticket.correo}</p>
              <p><strong>Dependencia:</strong> ${ticket.dependencia}</p>
              <p><strong>Extensión:</strong> ${ticket.ext}</p>
          </div>
          <div class="col">
              <p><strong>Tema:</strong> ${ticket.tema}</p>
              <p><strong>Subtema:</strong> ${ticket.subtema}</p>
          </div>
          <div>
              <p><strong>Detalle:</strong> ${ticket.detalle}</p>
          </div>
          <div class="col-12 mt-4 position-relative" id="timeline">
              ${crearLineaProgreso(ticket)}
              <div class="d-flex justify-content-between align-items-center px-4 position-relative" style="z-index: 2;">
                  ${crearPaso("enviado", "fa-envelope", "ENVIADO", formatearFecha(ticket.fechainicio))}
                  ${crearPaso("visto", "fa-eye", "VISTO", formatearFecha(ticket.fechaleido))}
                  ${crearPaso("gestionado-cerrado", "fa-check", "GESTIONADO/CERRADO", formatearFecha(ticket.fechacierre))}
              </div>
          </div>
          <div class="col">
            <p style="white-space: pre-wrap;"><strong>Observaciones:</strong> ${observacionMostrada}</p>
          </div>

        `;
        } else {
          Swal.fire({
            title: "Error",
            text: result.mensaje || "No se encontró el ticket.",
            icon: "error",
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Swal.fire({
          title: "Error",
          text: "Hubo un error al actualizar la información.",
          icon: "error",
        });
      });
  }


  window.resetForm = resetForm;

  const resetButton = anotherTicketContainer.querySelector("button");
  if (resetButton) {
    resetButton.addEventListener("click", resetForm);
  }

  const refreshButton = document.getElementById("refreshTicketBtn");
  if (refreshButton) {
    refreshButton.addEventListener("click", refrescarTicket);
  }
});
