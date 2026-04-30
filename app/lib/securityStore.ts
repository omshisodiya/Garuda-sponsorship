"use client"

import {create} from "zustand"

type SecurityState={
teamLocked:boolean
setTeamLocked:(value:boolean)=>void

forceLogout:number
triggerForceLogout:()=>void
}

export const useSecurityStore=
create<SecurityState>((set)=>({

teamLocked:false,

setTeamLocked:(value)=>
set({
teamLocked:value
}),

forceLogout:0,

triggerForceLogout:()=>
set((state)=>({
forceLogout:
state.forceLogout+1
}))

}))