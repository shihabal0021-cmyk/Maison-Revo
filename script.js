let products=[];
let cart=JSON.parse(localStorage.getItem("mr_cart")||"[]");
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const money=n=>"৳"+Number(n).toLocaleString("en-BD");

async function loadProducts(){
  try{
    const r=await fetch("/api/products",{cache:"no-store"});
    if(!r.ok)throw new Error("Product API unavailable");
    products=await r.json();
  }catch(e){
    products=[
      {id:1,name:"Classic Steel Ring",cat:"Rings",price:590,code:"MR"},
      {id:2,name:"Black Signet Ring",cat:"Rings",price:690,code:"MR"},
      {id:3,name:"Minimal Chain Bracelet",cat:"Bracelets",price:790,code:"BR"},
      {id:4,name:"Classic Cuff Bracelet",cat:"Bracelets",price:850,code:"CU"},
      {id:5,name:"Silver Hoop Earrings",cat:"Earrings",price:550,code:"ER"},
      {id:6,name:"Pearl Drop Earrings",cat:"Earrings",price:650,code:"PR"},
      {id:7,name:"Bold Link Bracelet",cat:"Bracelets",price:920,code:"BL"},
      {id:8,name:"Everyday Band Ring",cat:"Rings",price:490,code:"BD"}
    ];
  }
  renderProducts(); renderCart();
}
function renderProducts(cat="All"){
  const list=cat==="All"?products:products.filter(p=>p.cat===cat);
  $("#products").innerHTML=list.map(p=>`<article class="product"><div class="product-img">${p.image?`<img src="${p.image}" alt="${p.name}">`:(p.code||"MR")}</div><div class="product-info"><p>${p.cat}</p><h3>${p.name}</h3><span class="price">${money(p.price)}</span><button class="add" onclick="addToCart(${p.id})">ADD</button></div></article>`).join("");
}
function addToCart(id){
 const item=cart.find(x=>x.id===id);
 if(item)item.qty++; else cart.push({id,qty:1});
 save(); openDrawer();
}
function changeQty(id,d){
 const i=cart.findIndex(x=>x.id===id); if(i<0)return;
 cart[i].qty+=d; if(cart[i].qty<=0)cart.splice(i,1); save();
}
function save(){localStorage.setItem("mr_cart",JSON.stringify(cart));renderCart();}
function renderCart(){
 let total=0,count=0;
 $("#cartItems").innerHTML=cart.length?cart.map(x=>{
   const p=products.find(y=>y.id===x.id); total+=p.price*x.qty; count+=x.qty;
   return `<div class="cart-row"><div class="mini-img">${p.code}</div><div><h4>${p.name}</h4><small>${money(p.price)} × ${x.qty}</small></div><div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><button onclick="changeQty(${p.id},1)">+</button></div></div>`
 }).join(""):`<p style="color:#777;text-align:center;margin-top:60px">Your bag is empty.</p>`;
 $("#subtotal").textContent=money(total); $("#checkoutTotal").textContent=money(total); $("#cartCount").textContent=count;
}
function openDrawer(){ $("#cartDrawer").classList.add("open"); $("#overlay").classList.add("show");}
function closeDrawer(){ $("#cartDrawer").classList.remove("open"); $("#overlay").classList.remove("show");}
$("#openCart").onclick=openDrawer; $("#closeCart").onclick=closeDrawer; $("#overlay").onclick=closeDrawer;
$("#checkoutBtn").onclick=()=>{if(!cart.length)return alert("Your bag is empty."); closeDrawer();$("#checkoutModal").classList.add("show")};
$("#closeCheckout").onclick=()=>$("#checkoutModal").classList.remove("show");
$$(".filter").forEach(b=>b.onclick=()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.cat)});
$("#orderForm").onsubmit=e=>{
 e.preventDefault();
 const fd=new FormData(e.target); let lines=cart.map(x=>{const p=products.find(y=>y.id===x.id);return `${p.name} x${x.qty} — ${money(p.price*x.qty)}`}).join("%0A");
 const total=cart.reduce((s,x)=>s+products.find(y=>y.id===x.id).price*x.qty,0);
 const msg=`New Maison Revo Order%0A%0A${lines}%0A%0ATotal: ${money(total)}%0AName: ${encodeURIComponent(fd.get("name"))}%0APhone: ${encodeURIComponent(fd.get("phone"))}%0AAddress: ${encodeURIComponent(fd.get("address"))}%0APayment: ${encodeURIComponent(fd.get("payment"))}`;
 const whatsappNumber="8801XXXXXXXXX"; // Replace with your WhatsApp Business number
 window.open(`https://wa.me/${whatsappNumber}?text=${msg}`,"_blank");
};
renderProducts();renderCart();

loadProducts();
