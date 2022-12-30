
// Alert funtion
const hideAlert = ()=>{
    const el = document.querySelector('.alert');
    if(el) el.parentElement.removeChild(el);
}

const showAlert = (type,msg) =>{
    hideAlert();
    const markup = `<div class ="alert alert--${type}">${msg}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin',markup);
    window.setTimeout(hideAlert,5000)
}

//Login Function
const login = async(email,password) =>{
    try{
        const res = await axios({
            method:'POST',
            url:'/api/v1/users/login',
            data:{
                email:email,
                password:password
            }
        });
        
        if(res.data.status == 'success'){
            showAlert('success','Logged in successfullly')
        }
        window.setTimeout(()=>{
            location.assign('/');
        },1500)
    }catch(err){
        showAlert('error',err.response.data.message)
    }
}

//Logout Funtion
const logout = async()=>{
    try{

        const res = await axios({
            method:'GET',
            url:'/api/v1/users/logout'})

        if(res.data.status =='success') location.assign('/')
        
    }catch(err){
        console.log(err)
        showAlert('error', 'Error logging out! Try again')
    }
}

// Display mapbox funtion
const displayMap = (locations) =>{
    mapboxgl.accessToken = 'pk.eyJ1Ijoia2VtYXRsb24xMjMiLCJhIjoiY2xiazFra3BsMDVkdzNxbXU0N2JwMndnbCJ9.8RZTGpN2t70XMHrcV7hPXw';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/kematlon123/clbk2h2mo001316pmbec8f78l',
        scrollZoom: false
        // center: [-115.172652,36.110904],
        // zoom:5,
        // interactive:false
    });
    
    const bounds = new mapboxgl.LngLatBounds()
    
    locations.forEach(loc => {
        //Create Marker
        const el = document.createElement('div')
        el.className = 'marker';
        //Add marker
        new mapboxgl.Marker({
            element: el,
            anchor:'bottom'
        }).setLngLat(loc.coordinates).addTo(map)
        //Add popup
        new mapboxgl.Popup({
            offset:30
        }).setLngLat(loc.coordinates)
        .setHTML(`<p'>${loc.day}: ${loc.description}</p>`)
        .addTo(map)
    
        //Extend map bound to include current location
        bounds.extend(loc.coordinates)
    });
    
    map.fitBounds(bounds,{
        padding: {top: 200, bottom:200, left: 100, right: 100}
        })
}    
//Type is either 'password' or 'data'
const updateSettings = async(data,type) =>{
    try{
        const url = type === 'data' ? 'api/v1/users/updateMe' :'api/v1/users/updateMyPassword'
        const res = await axios({
            method:'PATCH',
            url:url,
            data:data
        });
        if(res.data.status == 'success'){
            showAlert('success',`${type.toUpperCase()} is updated successfully!`)
        }
    }catch(err){
        showAlert('error',err.response.data.message)
    }
}

// DOM ELEMENTS 
const mapBox = document.getElementById('map');
if (mapBox){
    const locations = JSON.parse(mapBox.dataset.locations)
    displayMap(locations)
}

const loginForm = document.querySelector('.form--login')
if(loginForm){
    loginForm.addEventListener('submit',e =>{
        e.preventDefault();
        const email= document.getElementById('email').value;
        const password= document.getElementById('password').value;

        login(email,password)
    })
}

const logOutBtn = document.querySelector('.nav__el--logout')
if(logOutBtn){
    logOutBtn.addEventListener('click', logout)
}

const userDataForm = document.querySelector('.form-user-data')
if(userDataForm){
    userDataForm.addEventListener('submit',async e =>{
        e.preventDefault();
        const form = new FormData();
        form.append('name',userDataForm.querySelector('#name').value);
        form.append('email',userDataForm.querySelector('#email').value);
        form.append('photo',userDataForm.querySelector('#photo').files[0]);
        console.log(form);
        await updateSettings(form,'data');

        location.reload();
    })
}

const userPasswordForm = document.querySelector('.form-user-settings');
if(userPasswordForm){
    userPasswordForm.addEventListener('submit',async e=>{
        e.preventDefault();
        document.querySelectorAll('.btn--save-password').textContent ='Updating...'
        const passwordCurrent= userPasswordForm.querySelector('#password-current').value;
        const password= userPasswordForm.querySelector('#password').value;
        const passwordConfirm= userPasswordForm.querySelector('#password-confirm').value;
        const data = {
            currentPassword: passwordCurrent,
            newPassword: password,
            newPasswordConfirm: passwordConfirm
        }
        await updateSettings(data,'password')
        document.querySelectorAll('.btn--save-password').textContent ='Save password'
        userPasswordForm.querySelector('#password-current').value =''
        userPasswordForm.querySelector('#password').value =''
        userPasswordForm.querySelector('#password-confirm').value=''
    })
}


const stripe = Stripe('pk_test_51MGMMeGs4M8Y3iziHUFVeDnk5VzJaWPDlVr6fEI5CWLj9L7UdfYpHiPrEt7vS2UtQG4ZggzvlYR0xsmuuL5uP3nW00V4wNW5DO')
const bookTour = async (tourId,Date) =>{
    try{
        //1)Get checkout session form API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
        //2)Create checkout form * change credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    }catch(err){
        showAlert('error',err);
    }
}

const bookBtn = document.getElementById('book-tour');
if(bookBtn){
    bookBtn.addEventListener('click', e=>{
        e.preventDefault();
        e.target.textContent = `Processing...`
        const { tourId } = e.target.dataset 
        bookTour(tourId)
    })
}

