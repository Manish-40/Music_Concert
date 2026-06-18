// =========================================================
// DATA — content reused from the original Antra Music site
// =========================================================
const shows = [
  { city: "Chembur", time: "07:00 PM", price: 499, rating: "5.0", img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&q=80", theater: "big_theater.html" },
  { city: "Powai", time: "11:00 PM", price: 299, rating: "4.3", img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&q=80", theater: "mini_theater.html" },
  { city: "Nasik", time: "09:00 PM", price: 499, rating: "5.0", img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80", theater: "big_theater.html" },
  { city: "Nepal", time: "07:00 PM", price: 299, rating: "5.0", img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80", theater: "mini_theater.html" },
  { city: "Bengaluru", time: "03:00 PM", price: 499, rating: "5.0", img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&q=80", theater: "big_theater.html" },
  { city: "Mumbai", time: "11:00 PM", price: 299, rating: "5.0", img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80", theater: "mini_theater.html" }
];

const galleryImages = [
  { img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80", cap: "Nepal · Sept 2021" },
  { img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80", cap: "Mumbai · Oct 2021" },
  { img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80", cap: "Delhi · Nov 2021" },
  { img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80", cap: "Chembur · Live" },
  { img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80", cap: "Backstage" },
  { img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80", cap: "Soundcheck" }
];

const faqs = [
  { q: "What careers are related to musicians?", a: "Producer, composer, choreographer, songwriter, music teacher, music therapist, conductor — a music career opens doors well beyond the stage." },
  { q: "What hours do musicians work?", a: "Musicians often work irregular hours. On tour, a day can mean travel, venue setup, a sound check, then the performance itself late into the evening." },
  { q: "What's the difference between a singer and a musician?", a: "The terms are often used interchangeably. Generally, singers perform songs, while musicians both write and perform — and may play instruments as well as sing." },
  { q: "What is the work environment of a musician?", a: "There's no single environment — recording happens in a studio, practice in a designated space, and performance on stage. Depending on the instrument, a musician might spend most of the show standing or seated." },
  { q: "What does a show cost?", a: "Pricing depends on the city, venue size, and date. Pick a show above to see seat prices, or call us for group bookings." },
  { q: "Who is eligible for a pro membership?", a: "Pro membership details are shared directly with returning venues and event partners — give us a call to learn more." }
];

// =========================================================
// RENDER: tickets
// =========================================================
const ticketGrid = document.getElementById('ticketGrid');
ticketGrid.innerHTML = shows.map(s => `
  <div class="ticket">
    <div class="ticket-main">
      <div class="ticket-img" style="background-image:url('${s.img}')"></div>
      <div class="ticket-rating"><i class="fa-solid fa-star"></i> ${s.rating}</div>
      <h3 class="ticket-title">${s.city}</h3>
      <p class="ticket-sub">Santosh K. &amp; Shashank Kapare</p>
      <div class="ticket-meta">
        <div><span>Time</span>${s.time}</div>
        <div><span>Doors</span>Open</div>
      </div>
    </div>
    <div class="ticket-stub">
      <span class="ticket-price">₹${s.price}</span>
      <button class="ticket-book" aria-label="Book ${s.city} show" data-city="${s.city}" data-theater="${s.theater}">
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
  </div>
`).join('');

ticketGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.ticket-book');
  if (!btn) return;
  const theater = btn.dataset.theater;
  if (theater) {
    window.location.href = theater;
    return;
  }

  const city = btn.dataset.city;
  document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  const eventField = document.querySelector('input[name="event"]');
  if (eventField && !eventField.value) eventField.value = city + ', ';
  setTimeout(() => eventField?.focus(), 500);
});

// =========================================================
// RENDER: gallery
// =========================================================
const galleryStrip = document.getElementById('galleryStrip');
galleryStrip.innerHTML = galleryImages.map(g => `
  <div class="gallery-item" style="background-image:url('${g.img}')">
    <div class="gallery-cap">${g.cap}</div>
  </div>
`).join('');

// =========================================================
// RENDER: FAQ accordion
// =========================================================
const faqList = document.getElementById('faqList');
faqList.innerHTML = faqs.map((f, i) => `
  <div class="faq-item" data-index="${i}">
    <button class="faq-q" aria-expanded="false">
      ${f.q}
      <i class="fa-solid fa-plus"></i>
    </button>
    <div class="faq-a"><p>${f.a}</p></div>
  </div>
`).join('');

faqList.addEventListener('click', (e) => {
  const btn = e.target.closest('.faq-q');
  if (!btn) return;
  const item = btn.closest('.faq-item');
  const answer = item.querySelector('.faq-a');
  const isOpen = item.classList.contains('open');

  // close all
  faqList.querySelectorAll('.faq-item.open').forEach(openItem => {
    if (openItem !== item) {
      openItem.classList.remove('open');
      openItem.querySelector('.faq-a').style.maxHeight = null;
      openItem.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    }
  });

  if (isOpen) {
    item.classList.remove('open');
    answer.style.maxHeight = null;
    btn.setAttribute('aria-expanded', 'false');
  } else {
    item.classList.add('open');
    answer.style.maxHeight = answer.scrollHeight + 'px';
    btn.setAttribute('aria-expanded', 'true');
  }
});

// =========================================================
// NAV: mobile toggle
// =========================================================
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('main-nav');
navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});
mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// =========================================================
// BACK TO TOP
// =========================================================
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  toTop.classList.toggle('visible', window.scrollY > 500);
});
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// =========================================================
// FEEDBACK FORM — star rating + comment (front-end only)
// =========================================================
const starButtons = document.querySelectorAll('.star-btn');
const ratingValue = document.getElementById('ratingValue');
const ratingReadout = document.getElementById('ratingReadout');
let currentRating = 0;

function paintStars(value) {
  starButtons.forEach((btn) => {
    const v = Number(btn.dataset.value);
    btn.classList.toggle('filled', v <= value);
  });
  if (ratingReadout) {
    ratingReadout.textContent = value > 0 ? `${value}/5 stars selected` : 'No rating selected';
  }
}

starButtons.forEach((btn) => {
  btn.addEventListener('mouseenter', () => paintStars(Number(btn.dataset.value)));
  btn.addEventListener('mouseleave', () => paintStars(currentRating));
  btn.addEventListener('click', () => {
    currentRating = Number(btn.dataset.value);
    ratingValue.value = currentRating;
    paintStars(currentRating);
  });
});

const feedbackForm = document.getElementById('feedbackForm');
const formStatus = document.getElementById('formStatus');
feedbackForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (currentRating === 0) {
    formStatus.textContent = 'Please choose a star rating before posting.';
    return;
  }
  formStatus.textContent = 'Thanks for rating us!';
  feedbackForm.reset();
  currentRating = 0;
  ratingValue.value = 0;
  paintStars(0);
});

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("antraUser"));

  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const userWelcome = document.getElementById("userWelcome");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    if (userWelcome) {
      userWelcome.style.display = "inline-block";
      userWelcome.textContent = `Welcome, ${user.name}`;
    }

    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      localStorage.removeItem("antraUser");
      localStorage.removeItem("antraToken");

      window.location.href = "index.html";
    });
  }
});