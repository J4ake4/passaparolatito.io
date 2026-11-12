document.addEventListener("DOMContentLoaded", () => {
    const isTuesday = new Date().getDay() === 2;
    let currentTypeFilter = 'tutti';
    let searchQuery = '';
    let menuData = [];

    const promoTag = document.getElementById('promo-tag');
    if (isTuesday && promoTag) {
        promoTag.style.display = 'inline-block';
    }

    const homeView = document.getElementById('home-view');
    const menuView = document.getElementById('menu-view');
    const openMenuButton = document.getElementById('open-menu');
    const homeButton = document.getElementById('home-button');
    const menuHeroText = document.getElementById('menu-hero-text');
    const searchInput = document.getElementById('barra-ricerca');
    const featuredPizzas = document.getElementById('featured-pizzas');
    const categoriesContainer = document.getElementById('categories-container');
    const mobileMenuQuery = window.matchMedia('(max-width: 700px)');

    function applyResponsiveText() {
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        document.body.dataset.device = isMobile ? 'mobile' : 'desktop';

        if (menuHeroText) {
            menuHeroText.textContent = isMobile
                ? 'Pizza, pesce e tavoli dove stare bene senza fretta.'
                : 'Pizza cotta con cura, pesce fresco e il gusto di una tavola semplice, genuina e fatta per stare insieme.';
        }

        if (searchInput) {
            searchInput.placeholder = isMobile
                ? 'Cerca una pizza o un ingrediente...'
                : 'Cerca una pizza, un ingrediente o un piatto del mare...';
        }
    }

    applyResponsiveText();
    window.addEventListener('resize', applyResponsiveText);

    function animateView(view) {
        view.classList.remove('view-enter');
        void view.offsetWidth;
        view.classList.add('view-enter');
        view.addEventListener('animationend', () => {
            view.classList.remove('view-enter');
        }, { once: true });
    }

    function openMenu() {
        homeView.hidden = true;
        menuView.hidden = false;
        animateView(menuView);
        homeButton.hidden = false;
        openMenuButton.setAttribute('aria-expanded', 'true');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    openMenuButton.addEventListener('click', openMenu);

    homeButton.addEventListener('click', () => {
        menuView.hidden = true;
        homeView.hidden = false;
        animateView(homeView);
        homeButton.hidden = true;
        openMenuButton.setAttribute('aria-expanded', 'false');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const mareCategories = ["antipasti_mare", "primi_mare", "secondi_mare", "fritti_mare"];

    const categoriesMap = {
        "classiche": "Pizze Classiche",
        "bianche": "Pizze Bianche",
        "piccolicanti": "Pizze Piccanti",
        "pesce": "Pizze al Pesce",
        "antipasti_mare": "Antipasti di Mare",
        "primi_mare": "Primi Piatti di Mare",
        "secondi_mare": "Secondi Piatti di Mare",
        "fritti_mare": "I Nostri Fritti di Mare"
    };

    fetch("menu.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Errore nel caricamento del file JSON");
            }
            return response.json();
        })
        .then(data => {
            menuData = data.map(item => {
                const isMare = mareCategories.includes(item.categoria);
                return {
                    ...item,
                    tipo: isMare ? "mare" : "pizze"
                };
            });
            renderFeaturedPizzas();
            renderMenu();
        })
        .catch(error => {
            console.error("Errore:", error);
            document.getElementById("categories-container").innerHTML = 
                `<p class="no-results error-message">Impossibile caricare il file menu.json. Apri la pagina con un server locale come Live Server.</p>`;
        });

    function renderMenu() {
        categoriesContainer.innerHTML = "";
        let anyMatch = false;

        for (const [catKey, catTitle] of Object.entries(categoriesMap)) {
            const items = menuData.filter(item => {
                const matchType = currentTypeFilter === 'tutti' || item.tipo === currentTypeFilter;
                const matchName = item.nome.toLowerCase().includes(searchQuery);
                const matchIngredients = item.ingredienti ? item.ingredienti.toLowerCase().includes(searchQuery) : false;
                return item.categoria === catKey && matchType && (matchName || matchIngredients);
            });

            if (items.length > 0) {
                anyMatch = true;
                const section = document.createElement("div");

                const title = document.createElement("h2");
                title.className = "category-title";
                title.innerText = catTitle;
                section.appendChild(title);

                const grid = document.createElement("div");
                grid.className = "menu-grid";

                items.forEach(item => {
                    grid.appendChild(createMenuCard(item));
                });

                section.appendChild(grid);
                categoriesContainer.appendChild(section);
            }
        }

        if (!anyMatch && menuData.length > 0) {
            categoriesContainer.innerHTML = `<p class="no-results">Nessun piatto trovato per "${searchQuery}". Prova con un altro ingrediente.</p>`;
        }

        updateMenuDisclosureMode();
    }

    function createMenuCard(item) {
        const { price, isPromo } = getPriceInfo(item);
        const card = document.createElement('article');
        card.className = 'card menu-item';

        const body = document.createElement('div');
        body.className = 'card-body';

        const detailsId = `menu-item-details-${item.id}`;
        const toggle = document.createElement('button');
        toggle.className = 'menu-item-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-controls', detailsId);
        toggle.setAttribute('aria-expanded', mobileMenuQuery.matches ? 'false' : 'true');

        const title = document.createElement('span');
        title.className = 'menu-item-name';
        title.textContent = item.nome;
        toggle.appendChild(title);

        const priceGroup = document.createElement('span');
        priceGroup.className = 'menu-price-group';

        const priceElement = document.createElement('span');
        priceElement.className = 'price';
        priceElement.textContent = `${price.toFixed(2).replace('.', ',')} €`;
        priceGroup.appendChild(priceElement);

        if (isPromo) {
            const promoBadge = document.createElement('span');
            promoBadge.className = 'badge-promo';
            promoBadge.textContent = 'PROMO 5€';
            priceGroup.appendChild(promoBadge);
        }
        toggle.appendChild(priceGroup);

        const details = document.createElement('div');
        details.className = 'menu-item-details';
        details.id = detailsId;
        details.setAttribute('aria-hidden', mobileMenuQuery.matches ? 'true' : 'false');
        details.inert = mobileMenuQuery.matches;

        const detailsInner = document.createElement('div');
        detailsInner.className = 'menu-item-details-inner';

        const ingredients = document.createElement('p');
        ingredients.className = 'menu-item-ingredients';
        ingredients.textContent = item.ingredienti || '';
        detailsInner.appendChild(ingredients);
        details.appendChild(detailsInner);

        body.appendChild(toggle);
        body.appendChild(details);
        card.appendChild(body);
        return card;
    }

    function updateMenuDisclosureMode() {
        const isMobile = mobileMenuQuery.matches;
        categoriesContainer.querySelectorAll('.menu-item').forEach(card => {
            const toggle = card.querySelector('.menu-item-toggle');
            const details = card.querySelector('.menu-item-details');
            const detailsInner = card.querySelector('.menu-item-details-inner');
            const priceGroup = card.querySelector('.menu-price-group');

            card.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', isMobile ? 'false' : 'true');
            details.setAttribute('aria-hidden', isMobile ? 'true' : 'false');
            details.inert = isMobile;

            if (priceGroup.parentElement !== toggle) {
                toggle.appendChild(priceGroup);
            }
        });
    }

    function toggleMenuItem(toggle) {
        if (!mobileMenuQuery.matches) {
            return;
        }

        const selectedCard = toggle.closest('.menu-item');
        const shouldOpen = !selectedCard.classList.contains('is-open');

        categoriesContainer.querySelectorAll('.menu-item.is-open').forEach(openCard => {
            if (openCard === selectedCard) {
                return;
            }

            movePriceGroup(openCard, false);
            openCard.classList.remove('is-open');
            openCard.querySelector('.menu-item-toggle').setAttribute('aria-expanded', 'false');
            openCard.querySelector('.menu-item-details').setAttribute('aria-hidden', 'true');
            openCard.querySelector('.menu-item-details').inert = true;
        });

        movePriceGroup(selectedCard, shouldOpen);
        selectedCard.classList.toggle('is-open', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));

        const details = selectedCard.querySelector('.menu-item-details');
        details.setAttribute('aria-hidden', String(!shouldOpen));
        details.inert = !shouldOpen;
    }

    function movePriceGroup(card, moveToDetails) {
        const toggle = card.querySelector('.menu-item-toggle');
        const detailsInner = card.querySelector('.menu-item-details-inner');
        const priceGroup = card.querySelector('.menu-price-group');
        const destination = moveToDetails ? detailsInner : toggle;

        if (priceGroup.parentElement === destination) {
            return;
        }

        const start = priceGroup.getBoundingClientRect();
        destination.appendChild(priceGroup);
        const end = priceGroup.getBoundingClientRect();
        const deltaX = start.left - end.left;
        const deltaY = start.top - end.top;

        if ((deltaX || deltaY) && typeof priceGroup.animate === 'function') {
            priceGroup.animate(
                [
                    { transform: `translate(${deltaX}px, ${deltaY}px)` },
                    { transform: 'translate(0, 0)' }
                ],
                { duration: 280, easing: 'ease-out' }
            );
        }
    }

    categoriesContainer.addEventListener('click', event => {
        const toggle = event.target.closest('.menu-item-toggle');
        if (toggle && categoriesContainer.contains(toggle)) {
            toggleMenuItem(toggle);
        }
    });

    if (mobileMenuQuery.addEventListener) {
        mobileMenuQuery.addEventListener('change', updateMenuDisclosureMode);
    } else {
        mobileMenuQuery.addListener(updateMenuDisclosureMode);
    }

    function getPriceInfo(item) {
        const isPromo = isTuesday && item.tipo === 'pizze' && item.categoria !== 'pesce';
        return {
            price: isPromo ? 5 : item.prezzo,
            isPromo
        };
    }

    function createCardBody(item) {
        const { price, isPromo } = getPriceInfo(item);
        const body = document.createElement('div');
        body.className = 'card-body';

        const title = document.createElement('h3');
        title.textContent = item.nome;
        body.appendChild(title);

        const ingredients = document.createElement('p');
        ingredients.textContent = item.ingredienti || '';
        body.appendChild(ingredients);

        const footer = document.createElement('div');
        footer.className = 'card-footer';

        const priceElement = document.createElement('span');
        priceElement.className = 'price';
        priceElement.textContent = `${price.toFixed(2).replace('.', ',')} €`;
        footer.appendChild(priceElement);

        if (isPromo) {
            const promoBadge = document.createElement('span');
            promoBadge.className = 'badge-promo';
            promoBadge.textContent = 'PROMO 5€';
            footer.appendChild(promoBadge);
        }

        body.appendChild(footer);
        return body;
    }

    function renderFeaturedPizzas() {
        const featuredNames = ['Margherita', 'Tito', 'Adam'];
        const items = featuredNames
            .map(name => menuData.find(item => item.nome.toLowerCase() === name.toLowerCase()))
            .filter(Boolean);

        featuredPizzas.innerHTML = '';
        items.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'featured-card';

            const number = document.createElement('span');
            number.className = 'featured-number';
            number.textContent = `0${index + 1}`;
            card.appendChild(number);

            if (item.immagine) {
                const image = document.createElement('img');
                image.className = 'featured-image';
                image.src = item.immagine;
                image.alt = `Pizza ${item.nome}`;
                image.loading = 'lazy';
                image.addEventListener('error', () => image.remove(), { once: true });
                card.appendChild(image);
            }

            const body = createCardBody(item);
            body.classList.add('featured-body');
            card.appendChild(body);
            featuredPizzas.appendChild(card);
        });
    }

    window.setFilter = function(type, btn) {
        currentTypeFilter = type;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMenu();
    };

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderMenu();
        });
    }
});