/* The original collection, restored by request on 2026-09-30.
   This presentation is intentionally independent of the newer journey catalog.
   Preview the selected stone directly; never route these month indexes into it. */
(() => {
  'use strict';
  const stones = Object.freeze([
  {
    "month": 1,
    "chapter": "Arrival",
    "stone": "Clear quartz",
    "color": "#cddae3",
    "firstReveal": "You made room for a beginning.",
    "beneathStone": "This first piece is yours to keep.",
    "mineral": "original/assets/mineral-quartz-circular.webp",
    "rendered": false
  },
  {
    "month": 2,
    "chapter": "Spark",
    "stone": "Amethyst",
    "color": "#7c36b6",
    "firstReveal": "One day kept meeting the next.",
    "beneathStone": "Small returns leave a trace.",
    "mineral": "original/assets/mineral-amethyst-circular.webp",
    "rendered": false
  },
  {
    "month": 3,
    "chapter": "Voice",
    "stone": "Citrine",
    "color": "#e0a428",
    "firstReveal": "A rhythm is becoming yours.",
    "beneathStone": "There is warmth in what you have built.",
    "mineral": "original/assets/mineral-citrine-circular.webp",
    "rendered": false
  },
  {
    "month": 4,
    "chapter": "Growth",
    "stone": "Green tourmaline",
    "color": "#267e55",
    "firstReveal": "Look at what has taken root.",
    "beneathStone": "You are allowed to grow at your own pace.",
    "mineral": "original/assets/mineral-green-tourmaline-circular.webp",
    "rendered": false
  },
  {
    "month": 5,
    "chapter": "Mark",
    "stone": "Aquamarine",
    "color": "#68bfd1",
    "firstReveal": "Your days have a shape now.",
    "beneathStone": "Not perfect days. Your days.",
    "mineral": "original/assets/mineral-aquamarine-circular.webp",
    "rendered": false
  },
  {
    "month": 6,
    "chapter": "Bond",
    "stone": "Carnelian",
    "color": "#d45a25",
    "firstReveal": "Half a year, held in your hands.",
    "beneathStone": "The pieces belong to one story.",
    "mineral": "assets/bracelet/gem-06.webp",
    "rendered": true
  },
  {
    "month": 7,
    "chapter": "Aura",
    "stone": "Lapis lazuli",
    "color": "#2857bb",
    "firstReveal": "There is more here than you can see at once.",
    "beneathStone": "You can carry depth quietly.",
    "mineral": "assets/bracelet/gem-07.webp",
    "rendered": true
  },
  {
    "month": 8,
    "chapter": "Strength",
    "stone": "Rose quartz",
    "color": "#d88faa",
    "firstReveal": "Softness can be a kind of strength.",
    "beneathStone": "Nothing earned here needs to be proved aloud.",
    "mineral": "assets/bracelet/gem-08.webp",
    "rendered": true
  },
  {
    "month": 9,
    "chapter": "Depth",
    "stone": "Labradorite",
    "color": "#4e8ea8",
    "firstReveal": "Some things only appear when the light changes.",
    "beneathStone": "Another way of seeing what was already there.",
    "mineral": "original/assets/mineral-labradorite-circular.webp",
    "rendered": false
  },
  {
    "month": 10,
    "chapter": "Guardian",
    "stone": "Almandine garnet",
    "color": "#922947",
    "firstReveal": "You have learned what you want to protect.",
    "beneathStone": "There is room here for the whole of you.",
    "mineral": "assets/bracelet/gem-10.webp",
    "rendered": true
  },
  {
    "month": 11,
    "chapter": "Ascension",
    "stone": "Green aventurine",
    "color": "#599766",
    "firstReveal": "Almost whole. Already meaningful.",
    "beneathStone": "Every piece still matters.",
    "mineral": "assets/bracelet/gem-11.webp",
    "rendered": true
  },
  {
    "month": 12,
    "chapter": "Halo",
    "stone": "Natural opal",
    "color": "#a9a5cf",
    "firstReveal": "A year, made visible.",
    "beneathStone": "You did not become someone else. You became more of yourself.",
    "mineral": "original/assets/mineral-opal-circular.webp",
    "rendered": false
  }
].map(Object.freeze));
  window.HaloMineralCollection = {
    stones,
    create(collection) {
      if (!collection) return;
      const originals = stones.map((stone, index) => {
        const button = document.createElement('button');
        button.className = 'mineral'; button.type = 'button';
        button.dataset.collectionStone = index;
        button.style.setProperty('--stone-color', stone.color);
        const month = 'Month ' + String(stone.month).padStart(2, '0');
        button.setAttribute('aria-label', stone.stone + ', ' + month + '. View stone');
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-controls', 'stone-detail-dialog');
        const frame = document.createElement('span');
        frame.className = 'mineral-window' + (stone.rendered ? ' mineral-window-render' : '');
        const image = document.createElement('img');
        image.src = stone.mineral; image.alt = ''; image.draggable = false;
        image.width = stone.rendered ? 900 : 720; image.height = stone.rendered ? 750 : 540;
        image.loading = 'lazy'; image.decoding = 'async'; frame.append(image);
        const name = document.createElement('strong'); name.textContent = stone.stone;
        const label = document.createElement('span'); label.textContent = month + ' / ' + stone.chapter;
        button.append(frame, name, label); collection.append(button);
        return button;
      });
      const carousel = window.HaloMineralCarousel?.create(collection);
      window.HaloMineralHover?.create(collection);
      collection.addEventListener('click', event => {
        const button = event.target.closest('[data-collection-stone]');
        if (!button || !collection.contains(button)) return;
        const index = Number(button.dataset.collectionStone);
        const dialog = document.getElementById('stone-detail-dialog');
        if (dialog.open) return;
        carousel?.setSuspended(true);
        dialog.addEventListener('close', () => {
          // A visual buffer may have opened the dialog. Restore an accessible
          // original at the same visual position, not an aria-hidden copy.
          collection.scrollLeft += originals[index].offsetLeft - button.offsetLeft;
          originals[index].focus({preventScroll:true});
          carousel?.setSuspended(false);
        }, {once:true});
        window.HaloStoneDetails.openCollection(stones[index]);
      });
      collection.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const focused = originals.indexOf(event.target.closest('[data-collection-stone]'));
        if (focused < 0) return;
        event.preventDefault();
        const last = originals.length - 1;
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? last :
          Math.min(last, Math.max(0, focused + (event.key === 'ArrowLeft' ? -1 : 1)));
        originals[next].focus();
      });
    }
  };
})();
