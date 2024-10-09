document.addEventListener('DOMContentLoaded', () => {
    
    const eventsContainer = document.getElementById('events-container');
    const registrationForm = document.getElementById('registration-form');
    const priceTracker = document.getElementById('price-tracker');
    const otherStateRadio = document.getElementById('other-state');
    const otherStateNameInput = document.getElementById('other-state-name');
    let allEvents = [];

    // Show/hide other state name input
    otherStateRadio.addEventListener('change', () => {
        otherStateNameInput.style.display = otherStateRadio.checked ? 'inline' : 'none';
        otherStateNameInput.required = otherStateRadio.checked;
    });

    function fetchEvents() {
        fetch('http://192.168.209.82:3000/events')
            .then(response => response.json())
            .then(data => {
                allEvents = data;
                const groupedEvents = groupEventsByType(data);
                renderGroupedEvents(groupedEvents);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                eventsContainer.innerText = 'Failed to load events.';
            });
    }

    function groupEventsByType(events) {
        return events.reduce((acc, event) => {
            if (!acc[event.EventType]) {
                acc[event.EventType] = [];
            }
            acc[event.EventType].push(event);
            return acc;
        }, {});
    }

    function groupCompetitionsByTier(competitions) {
        return competitions.reduce((acc, event) => {
            if (!acc[event.EventTier]) {
                acc[event.EventTier] = [];
            }
            acc[event.EventTier].push(event);
            return acc;
        }, {});
    }

    function renderGroupedEvents(groupedEvents) {
        for (const [eventType, events] of Object.entries(groupedEvents)) {
            const typeDiv = document.createElement('div');
            typeDiv.className = 'event-type-group';
            typeDiv.innerHTML = `<h2>${eventType}</h2>`;

            if (eventType.toLowerCase() === 'competition') {
                const groupedCompetitions = groupCompetitionsByTier(events);
                const tiers = ['A', 'B', 'C'];
                tiers.forEach(tier => {
                    if (groupedCompetitions[tier] && groupedCompetitions[tier].length > 0) {
                        const tierDiv = document.createElement('div');
                        tierDiv.className = 'tier-group';
                        tierDiv.innerHTML = `<h3>Tier ${tier} Competitions</h3>`;
                        renderEvents(groupedCompetitions[tier], tierDiv);
                        typeDiv.appendChild(tierDiv);
                    }
                });
            } else {
                renderEvents(events, typeDiv);
            }

            eventsContainer.appendChild(typeDiv);
        }
    }

    function renderEvents(events, container) {
        events.forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.innerHTML = `
                <input type="checkbox" id="${event.EventID}" name="event" value="${event.EventID}" data-price="${event.EventPrice}">
                <label for="${event.EventID}">${event.EventName} - Rs.${event.EventPrice}</label>
            `;
            container.appendChild(eventDiv);
        });
    }

    eventsContainer.addEventListener('change', updatePriceTracker);

    function updatePriceTracker() {
        const checkedEvents = document.querySelectorAll('input[name="event"]:checked');
        const totalPrice = Array.from(checkedEvents).reduce((sum, event) => sum + parseFloat(event.dataset.price), 0);
        priceTracker.textContent = `Total Price: Rs.${totalPrice.toFixed(2)}`;
    }

    registrationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(registrationForm);
        const totalPrice = parseFloat(priceTracker.textContent.split('Rs.')[1]);

        // Handle attendance days
        const attendanceDays = formData.getAll('attendanceDays');
        formData.delete('attendanceDays');
        formData.append('attendanceDays', attendanceDays.join(', '));

        // Handle state selection
        const stateValue = formData.get('state');
        if (stateValue === 'Other') {
            formData.set('state', formData.get('otherStateName'));
        }
        formData.delete('otherStateName');

        const queryString = new URLSearchParams(formData).toString();
        window.location.href = `payment.html?${queryString}&totalPrice=${totalPrice}`;
    });

    fetchEvents();
});