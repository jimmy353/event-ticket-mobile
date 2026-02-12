import { apiRequest } from "./request";

export async function fetchEvents() {
  return await apiRequest("/api/events/");
}

export async function fetchMyTickets() {
  return await apiRequest("/api/tickets/my/");
}

export async function fetchTicketTypes(eventId) {
  return await apiRequest(`/api/tickets/types/${eventId}/`);
}

export async function createOrder(ticketTypeId, quantity) {
  return await apiRequest("/api/orders/create/", {
    method: "POST",
    body: JSON.stringify({
      ticket_type_id: ticketTypeId,
      quantity: quantity,
    }),
  });
}
