document.addEventListener('DOMContentLoaded', () => {
    const qrContainer = document.getElementById('qr-container');
    const urlParams = new URLSearchParams(window.location.search);
    const totalPrice = urlParams.get('totalPrice');

    fetch('http://192.168.209.82:3000/generate-qr', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: totalPrice }),
    })
    .then(response => response.json())
    .then(data => {
        displayQRCode(data.qrCodeUrl, totalPrice);
    })
    .catch(error => {
        console.error('Error:', error);
        qrContainer.innerHTML = '<p>Error generating QR code. Please try again.</p>';
    });

    function displayQRCode(qrCodeUrl, totalPrice) {
        qrContainer.innerHTML = `
            <p>Total Amount: Rs.${totalPrice}</p>
            <img src="${qrCodeUrl}" alt="Payment QR Code">
            <p>Scan this QR code to make the payment</p>
            <div class="verification-buttons">
                <button onclick="handleVerification(true)" class="verify-btn">Verify Payment</button>
                <button onclick="handleVerification(false)" class="not-verify-btn">Not Verified</button>
            </div>
        `;
    }
});

function handleVerification(isVerified) {
    if (!isVerified) {
        window.location.href = 'index.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const selectedEvents = [];
    urlParams.forEach((value, key) => {
        if (key === 'event') {
            selectedEvents.push(value);
        }
    });

    const registrationData = {
        
        firstName: urlParams.get('firstName'),
        lastName: urlParams.get('lastName'),
        email: urlParams.get('email'),
        phone: urlParams.get('phone'),
        organization: urlParams.get('organization'),
        state: urlParams.get('state'),
        bandId: urlParams.get('bandId'),
        selectedEvents: selectedEvents
    };

    fetch('http://192.168.209.82:3000/verify-registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Registration successful! Your Band ID is: ${data.bandId}`);
            window.location.href = 'index.html';
        } else {
            alert('Registration failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Registration failed. Please try again.');
    });
}