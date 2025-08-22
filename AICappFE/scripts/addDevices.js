// Script untuk menambahkan berbagai jenis devices
const API_BASE_URL = "https://1ea4168934f3.ngrok-free.app/api";

async function addVarietyDevices() {
    try {
        // Login first
        const loginResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: "test@example.com",
                password: "password123",
            }),
        });

        const loginData = await loginResponse.json();
        if (!loginResponse.ok) {
            console.error("Login failed:", loginData);
            return;
        }

        const authToken = loginData.token;
        console.log("✅ Logged in successfully");

        // Devices to create based on backend enum
        const devicesToCreate = [
            { type: "refrigerator", isOn: true },
            { type: "washing_machine", isOn: false },
            { type: "microwave", isOn: false },
            { type: "air_conditioner", isOn: false },
            { type: "computer", isOn: true },
            { type: "lighting", isOn: true },
            { type: "fan", isOn: false }
        ];

        console.log("\n🔧 Creating variety of devices...");

        for (const device of devicesToCreate) {
            try {
                const response = await fetch(`${API_BASE_URL}/device`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(device),
                });

                const data = await response.json();
                if (response.ok) {
                    console.log(`✅ Created: ${device.type} (${device.isOn ? 'ON' : 'OFF'})`);
                } else {
                    console.log(`⚠️ Failed to create ${device.type}:`, data.message);
                }
            } catch (error) {
                console.error(`❌ Error creating ${device.type}:`, error);
            }
        }

        // Now get all devices to verify
        console.log("\n📱 Current devices after creation:");
        const getResponse = await fetch(`${API_BASE_URL}/device`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        const allDevices = await getResponse.json();
        if (getResponse.ok) {
            console.log(`\n📊 Total devices: ${allDevices.length}`);
            allDevices.forEach((device, index) => {
                console.log(`  ${index + 1}. ${device.type} (${device.isOn ? 'ON' : 'OFF'})`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

addVarietyDevices();
