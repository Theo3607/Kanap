// Mise en place de la page de confirmation. Cette page est affichée après avoir validé le formulaire de commande.

let params = new URLSearchParams(window.location.search);
const orderId = params.get("order");
document.getElementById("orderId").innerHTML += `${orderId}`;