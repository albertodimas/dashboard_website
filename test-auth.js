// Script para probar el login y registro

async function testLogin() {
  console.log('Probando login con cuenta demo...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'owner@luxurycuts.com',
        password: 'password123'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login exitoso!');
      console.log('Usuario:', data.user);
    } else {
      console.log('❌ Login falló:', data.error);
    }
  } catch (error) {
    console.error('Error en la petición:', error);
  }
}

async function testRegister() {
  console.log('\nProbando registro de nuevo usuario...');
  
  const timestamp = Date.now();
  const newUser = {
    email: `test${timestamp}@example.com`,
    password: 'TestPassword123',
    name: 'Test User',
    businessName: 'Test Business',
    subdomain: `test${timestamp}`
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registro exitoso!');
      console.log('Nuevo usuario:', data.user);
      
      // Probar login con el nuevo usuario
      console.log('\nProbando login con el nuevo usuario...');
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password
        })
      });
      
      const loginData = await loginResponse.json();
      if (loginResponse.ok) {
        console.log('✅ Login con nuevo usuario exitoso!');
      } else {
        console.log('❌ Login con nuevo usuario falló:', loginData.error);
      }
    } else {
      console.log('❌ Registro falló:', data.error);
    }
  } catch (error) {
    console.error('Error en la petición:', error);
  }
}

// Ejecutar las pruebas
async function runTests() {
  await testLogin();
  await testRegister();
}

runTests();