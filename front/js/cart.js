const cartItems = document.getElementById("cart__items");
document.title = 'Kanap';

// Fonction pour créer une nouvelle balise HTML quand on appelle la fonction

function createTag(newTagName) {
  return document.createElement(newTagName);
}

const cart = JSON.parse(localStorage.getItem("cart")) || [];

/// Ici, nous créons les fonctions supprimer un produit | calculer le total dynamiquement | envoyer la commande

const totalQuantityElement = document.getElementById("totalQuantity");
const displayedTotal = document.getElementById("totalPrice");
let removeButton;
let quantityInputField;
let getParentArticle;
let updatedProduct;

// Ici on ajoute un event listener sur les balises <input> pour la quantité de chaque produit et leur bouton "Supprimer"
const eventListener = function () {
  quantityInputField = document.querySelectorAll(
    ".cart__item__content__settings__quantity > .itemQuantity"
  );
  quantityInputField.forEach((element) => {
    element.setAttribute("value", element.value);
    productQuantity += element.value;
    element.addEventListener("change", pushLocalStorageQuantity);
  });
  removeButton = document.querySelectorAll(".deleteItem");
  removeButton.forEach((element) => {
    element.addEventListener("click", removeFromCart);
  });
};

const getUnitQuantities = function () {
  quantityInputField.setAttribute("value", element.value);
};

// Quand la quantité dans les <input> change, nous calculons le total depuis les quantités affichées et le prix des produits (sans reload)
const getCartTotal = function () {
  let cartTotalPrice = new Number();
  let cartTotalQuantity = new Number();
  let i = 0;
  while (i !== quantityInputField.length) {
    cartTotalQuantity += Number(quantityInputField[i].value);
    cartTotalPrice += displayPrice[i] * quantityInputField[i].value;
    i++;
  }
  totalQuantityElement.textContent = cartTotalQuantity;
  displayedTotal.textContent = cartTotalPrice;
  eventListener();
};

// Ici nous comparons l'id et la couleur de l'élément 'article' avec ceux contenus dans le panier dans le localstorage
const getProductToUpdate = function () {
  let parentArticleDataset = {
    color: getParentArticle.dataset.color,
    id: getParentArticle.dataset.id,
  };
  updatedProduct = cart.find(
    (product) =>
      product.color == parentArticleDataset.color &&
      product.id == parentArticleDataset.id
  );
  return updatedProduct;
};

// On trouve l'index du produit dans cart pour le supprimer, le retirer du DOM et forcer un recalcul du total (sans reload)
const removeFromCart = function () {
  getParentArticle = this.closest("article");
  getProductToUpdate();
  if (updatedProduct) {
    const indexOfRemovedProduct = cart.indexOf(updatedProduct);
    const removeProduct = cart.splice(indexOfRemovedProduct, 1);
    getParentArticle.remove();
    localStorage.setItem("cart", JSON.stringify(cart));
    eventListener();
    getCartTotal();
  }
};

// On trouve l'index du produit dans le cart pour mettre à jour sa quantité, puis force un recalcul du total (sans reload)
const pushLocalStorageQuantity = function () {
  getParentArticle = this.closest("article");
  getProductToUpdate();
  if (updatedProduct) {
    const indexOfUpdatedProduct = cart.indexOf(updatedProduct);
    updatedProduct.quantity = parseInt(
      quantityInputField[indexOfUpdatedProduct].value
    );
    localStorage.setItem("cart", JSON.stringify(cart));
    eventListener();
    getCartTotal();
    convertCartToArray();
  }
};

// Ici on crée un nouveau bloc article pour chaque produit du panier
const createInnerContent = function () {
  cartContent += `<article class="cart__item" data-id="${cart[i].id}" data-color="${productColor}">
  <div class="cart__item__img"><img src="${cartItemImage}" alt="${cartItemImageAlt}"></div>
  <div class="cart__item__content">
  <div class="cart__item__content__description">
  <h2>${productName}</h2>
  <p>${productColor}</p>
  <p>${productPrice} €</p>
  </div>
  <div class="cart__item__content__settings">
  <div class="cart__item__content__settings__quantity">
  <p>Qté : </p>
  <input type="number" class="itemQuantity" name="itemQuantity" min="1" max="100" value="${cart[i].quantity}">
  </div>
  <div class="cart__item__content__settings__delete">
  <p class="deleteItem">Supprimer</p>
  </div>
  </div>
  </div>
  </article>`;
};

let cartItemImage;
let cartItemImageAlt;
let productName;
let productColor;
let productPrice;
let productQuantity = [];
let displayPrice = [];
let cartContent = "";
let i = 0;

// Fonction principale du panier
function displayCart() {
  fetch("http://localhost:3000/api/products")
    .then((response) => {
      return response.json();
    })
    .then((APIProductList) => {
      while (i !== cart.length) {
        const matchingProduct = APIProductList.find(
          (product) => product._id === cart[i].id
        );
        APIProductList.forEach((productInList) => {
          if (matchingProduct) {
            cartItemImage = `${matchingProduct.imageUrl}`;
            cartItemImageAlt = `${matchingProduct.altTxt}`;
            productName = `${matchingProduct.name}`;
            productColor = `${cart[i].color}`;
            productPrice = `${matchingProduct.price}`;
          }
        });
        createInnerContent();
        displayPrice.push(productPrice);
        i++;
      }
      cartItems.innerHTML += cartContent;
      eventListener();
      getCartTotal();
      formInputValidation();
    });
}

displayCart();

// ------------------------- FORMULAIRE DE COMMANDE ------------------------- //

const formInputs = document.querySelectorAll(
  ".cart__order__form__question > input"
);
const formInputsErrors = document.querySelectorAll(
  ".cart__order__form__question > p"
);
const orderButton = document.getElementById("order");

// On ajoute un eventListener à chaque élément champs du formulaire
const formInputValidation = function () {
  formInputs.forEach((inputField) => {
    inputField.addEventListener("change", checkInput);
  });
  orderButton.addEventListener("click", sendCartAndInput);
};

// REGEX
const nameFilter = /^[a-zç]+[a-zç ,.'-]+$/i;
const emailFilter =
  /[a-z0-9!#%&'*+/=^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;
let validationStatus = [undefined, undefined, undefined, undefined, undefined];
let errorName;

// On va détecter le champs qui a été modifié, vérifier s'il répond aux critères de saisie définis, et si false modifier la balise html d'erreur correspondante. Si la saisie est à nouveau valide après modification, on va retirer le message d'erreur.
const checkInput = function (targetElement) {
  let i = 0;
  while (i < 5) {
    if (this.id == `${formInputs.item(i).name}`) {
      if (
        this.id == "firstName" ||
        this.id == "lastName" ||
        this.id == "city"
      ) {
        validationStatus[i] = nameFilter.test(this.value);
      } else if (this.id == "email") {
        validationStatus[i] = emailFilter.test(this.value);
      } else if (this.id == "address") {
        if (formInputs[i].value.length > 5) {
          validationStatus[i] = true;
        } else {
          validationStatus[i] = false;
        }
      }
      errorName = document.getElementById(`${formInputsErrors.item(i).id}`);
      if (validationStatus[i] == false) {
        errorName.textContent = "Vérifiez votre saisie";
      } else {
        errorName.textContent = "";
      }
      break;
    }
    i++;
  }
};

let contact;

// On sauvegarde le contenu des champs du formulaire dans une variable contact
const saveInputForm = function () {
  contact = {
    firstName: `${formInputs[0].value}`,
    lastName: `${formInputs[1].value}`,
    address: `${formInputs[2].value}`,
    city: `${formInputs[3].value}`,
    email: `${formInputs[4].value}`,
  };
};

const products = [];

// On extrait le contenu du panier en localstorage et le sauvegarde dans une variable products
const convertCartToArray = function () {
  cart.forEach((product) => {
    cart.find((product) => product.id);
    products.push(product.id);
  });
};

let orderProducts;

// On met ensemble tous le contenu du panier et le contenu des champs du formulaire au même endroit
const mergeInputs = function () {
  convertCartToArray();
  saveInputForm();
  orderProducts = {
    contact,
    products,
  };
};

// Ensuite on vérifie que tous les champs du formulaire sont valides, et si oui on envoie le contenu du panier, on redirige vers la page de confirmation correspondant à l'order id, et on vide le localstorage
function sendCartAndInput(event) {
  event.preventDefault();
  if (
    !validationStatus.includes(false) &&
    !validationStatus.includes(undefined)
  ) {
    mergeInputs();
    fetch("http://localhost:3000/api/products/order", {
      method: "POST",
      body: JSON.stringify(orderProducts),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        localStorage.clear();
        window.location.href = `confirmation.html?order=${response.orderId}`;
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    alert(
      "Le formulaire de commande n'est pas valide. Veuillez correctement remplir tous les champs s'il vous plaît."
    );
  }
}