export default function Home() {

return (
<div style={{
minHeight:"100vh",
background:
"linear-gradient(135deg,#120003,#6F0008,#250004)",
color:"#D4AF37",
padding:"60px",
fontFamily:"serif"
}}>

<nav style={{
display:"flex",
justifyContent:"space-between",
marginBottom:"80px"
}}>
<h2>GARUDA COMMAND CENTRE</h2>
<div>17Oct2026</div>
</nav>


<section style={{
textAlign:"center",
marginTop:"70px"
}}>
<h1 style={{
fontSize:"90px",
marginBottom:"20px"
}}>
Dandiya Night '26
</h1>

<h2 style={{
fontSize:"38px"
}}>
Luxury Sponsorship Operating System
</h2>

<p style={{
marginTop:"30px",
fontSize:"24px"
}}>
Target Sponsorship ₹5,00,000+
</p>
</section>


<div style={{
display:"grid",
gridTemplateColumns:"repeat(4,1fr)",
gap:"30px",
marginTop:"90px"
}}>

{[
["532","Leads"],
["41","Deals"],
["₹5L","Pipeline"],
["89%","Conversion"]
].map(item=>(

<div
key={item[1]}
style={{
padding:"40px",
borderRadius:"28px",
background:"rgba(255,255,255,.04)",
border:"1px solid rgba(212,175,55,.2)"
}}
>
<h1>{item[0]}</h1>
<p>{item[1]}</p>
</div>

))}

</div>


<div style={{
marginTop:"80px",
padding:"50px",
borderRadius:"30px",
background:"rgba(255,255,255,.03)"
}}>
<h2>Executive Sponsorship Pipeline</h2>

<div style={{
display:"flex",
gap:"20px",
marginTop:"35px"
}}>

{[
"Prospects",
"Contacted",
"Negotiating",
"Closed"
].map(x=>(

<div
key={x}
style={{
flex:1,
padding:"30px",
borderRadius:"20px",
background:"rgba(255,255,255,.05)"
}}
>
{x}
</div>

))}

</div>
</div>

</div>
)

}
