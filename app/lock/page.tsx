export default function Lock(){

return(

<div style={{
padding:"60px",
background:"#140002",
minHeight:"100vh",
color:"#D4AF37"
}}>

<h1 style={{
fontSize:"62px"
}}>
Security Lock Console
</h1>


<div style={{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:"30px",
marginTop:"50px"
}}>

{[
"Force Logout All Users",
"Lock Team Dashboards",
"Disable CSV Exports",
"Freeze Lead Database"
].map(item=>(

<div
key={item}
style={{
padding:"40px",
borderRadius:"25px",
background:"rgba(255,255,255,.05)"
}}
>

<h2>
{item}
</h2>

<button style={{
marginTop:"20px"
}}>
Execute
</button>

</div>

))}

</div>

</div>

)

}
