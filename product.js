/* =============================================
   PHOTO PAGES — "See it on your wall" and ordering
   Adds a Photo / On your wall switch to the product image, a framed
   room preview with frame colours, and a format picker. "Order this
   photo" opens the contact form with the photo, format and price
   written into the message. Without JS the order link still works.
   ============================================= */
(() => {
  const split = document.querySelector('.product__split');
  const orderLink = document.querySelector('[data-order]');
  if (!split || !orderLink) return;

  const imageCol = split.querySelector('.product__image-col');
  const photoFrame = imageCol.querySelector('.product__frame');
  const photo = photoFrame.querySelector('img');
  const title = (document.querySelector('.product__title')?.textContent || 'this photo').trim();
  const priceText = (document.querySelector('.product__price')?.textContent || '').trim();
  const page = location.pathname.split('/').pop() || '';

  // ---------- View switch ----------
  const views = document.createElement('div');
  views.className = 'pv-switch';
  views.setAttribute('role', 'group');
  views.setAttribute('aria-label', 'How to view this photo');
  views.innerHTML = `
    <button type="button" class="pv-switch__btn" data-view="photo" aria-pressed="true">Photo</button>
    <button type="button" class="pv-switch__btn" data-view="wall" aria-pressed="false">On your wall</button>`;

  // ---------- Room preview ----------
  const wall = document.createElement('div');
  wall.className = 'pv-wall';
  wall.hidden = true;
  wall.innerHTML = `
    <div class="pv-wall__room" aria-hidden="true">
      <div class="pv-wall__light"></div>
      <figure class="pv-wall__art" data-frame="oak">
        <div class="pv-wall__mat"><img alt="" decoding="async"></div>
      </figure>
      <div class="pv-wall__sideboard"><span></span></div>
      <div class="pv-wall__vase"><span></span></div>
      <div class="pv-wall__books"></div>
      <div class="pv-wall__floor"></div>
    </div>
    <div class="pv-frames" role="group" aria-label="Preview frame">
      <span class="pv-frames__label">Preview frame</span>
      <button type="button" class="pv-frames__swatch" data-frame="oak" aria-pressed="true"><i></i>Oak</button>
      <button type="button" class="pv-frames__swatch" data-frame="black" aria-pressed="false"><i></i>Black</button>
      <button type="button" class="pv-frames__swatch" data-frame="white" aria-pressed="false"><i></i>White</button>
    </div>`;

  const art = wall.querySelector('.pv-wall__art');
  const artImg = art.querySelector('img');
  artImg.src = photo.currentSrc || photo.src;
  artImg.alt = `${title} framed on a wall above a sideboard`;

  function sizeArt() {
    const w = artImg.naturalWidth || photo.naturalWidth;
    const h = artImg.naturalHeight || photo.naturalHeight;
    if (!w || !h) return;
    const ratio = w / h;
    art.style.setProperty('--pv-ratio', ratio.toFixed(3));
  }
  artImg.addEventListener('load', sizeArt);
  if (artImg.complete) sizeArt();

  imageCol.insertBefore(views, photoFrame);
  imageCol.appendChild(wall);

  views.querySelectorAll('.pv-switch__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const onWall = btn.dataset.view === 'wall';
      views.querySelectorAll('.pv-switch__btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      photoFrame.hidden = onWall;
      wall.hidden = !onWall;
    });
  });

  wall.querySelectorAll('.pv-frames__swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      wall.querySelectorAll('.pv-frames__swatch').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      art.dataset.frame = btn.dataset.frame;
    });
  });

  // ---------- Format picker ----------
  const formats = [
    { id: 'digital', name: 'Digital download', detail: priceText ? `${priceText}, personal use` : 'Personal use',
      note: `as a digital download${priceText ? ` (${priceText})` : ''}.` },
    { id: 'print', name: 'Print', detail: 'Sizes and price confirmed by email',
      note: 'as a print. Please let me know the sizes and prices.' },
    { id: 'commercial', name: 'Commercial licence', detail: 'Quoted for how you will use it',
      note: 'with a commercial licence. This is how I would like to use it: ' },
  ];

  const picker = document.createElement('fieldset');
  picker.className = 'pv-formats';
  picker.innerHTML = `<legend class="pv-formats__legend">Choose a format</legend>` + formats.map((f, i) => `
    <label class="pv-format">
      <input type="radio" name="pv-format" value="${f.id}"${i === 0 ? ' checked' : ''}>
      <span class="pv-format__name">${f.name}</span>
      <span class="pv-format__detail">${f.detail}</span>
    </label>`).join('');

  const small = document.createElement('p');
  small.className = 'pv-small';
  small.textContent = 'No payment is taken here. Your order goes straight to me, and I reply within 2 working days to confirm it.';

  orderLink.parentNode.insertBefore(picker, orderLink);
  orderLink.insertAdjacentElement('afterend', small);

  function updateOrder() {
    const chosen = formats.find((f) => f.id === picker.querySelector('input:checked').value);
    const note = `I'd like to order "${title.replace(/^"|"$/g, '')}"${page ? ` (${page})` : ''} ${chosen.note}`;
    orderLink.href = `contact.html?service=photography&note=${encodeURIComponent(note)}`;
    orderLink.textContent = chosen.id === 'digital' && priceText ? `Order the download, ${priceText}` : chosen.id === 'print' ? 'Ask for a print' : 'Ask about a licence';
  }

  picker.addEventListener('change', updateOrder);
  updateOrder();
})();
