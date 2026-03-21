
const STATUSES=[
 'Booking Confirmed',
 'Pickup Scheduled',
 'Picked Up',
 'In Transit',
 'Arrived at Destination Hub',
 'Delivered'
];

// Live tracking logic

async function track(){
 const id=document.getElementById('trackInput').value.trim().toUpperCase();
 const wrap=document.getElementById('timeline');
 wrap.innerHTML='';

 if(!/^CDI-\d{6}$/.test(id)){alert('Invalid Tracking ID');return;}
 
 try {
  const res = await fetch(`/api/track/${id}`);
  if(!res.ok){alert('Tracking ID not found');return;}
  
  const rec = await res.json();

  document.getElementById('service').innerText=rec.service;
  document.getElementById('route').innerText=rec.route;
  
  const updatedDate = new Date(rec.updatedAt || rec.createdAt);
  document.getElementById('updated').innerText=updatedDate.toLocaleString();

  STATUSES.forEach((s,i)=>{
   const step=document.createElement('div');
   step.className='step'+(i<rec.currentIndex?' done':'')+(i===rec.currentIndex?' current':'');
   step.innerHTML=`<div class="node"></div><div><div class="title">${s}</div><div class="desc">${i<=rec.currentIndex?'Completed':'Pending'}</div></div>`;
   wrap.appendChild(step);
  });

  document.getElementById('note').innerText=rec.staffNote;
 } catch (err) {
  console.error(err);
  alert('Network error while tracking.');
 }
}
