use fadroma::{
    Storage, Api, Querier,
    Extern, Env,
    InitResponse, HandleResponse, Binary,
    StdResult,
    schemars
};

#[derive(serde::Serialize, serde::Deserialize, schemars::JsonSchema)]
pub struct InitMsg {}
#[derive(serde::Serialize, serde::Deserialize, schemars::JsonSchema)]
pub enum HandleMsg { Null }
#[derive(serde::Serialize, serde::Deserialize, schemars::JsonSchema)]
pub enum QueryMsg { Echo }

pub(crate) fn init<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>, env: Env, msg: InitMsg,
) -> StdResult<InitResponse> {
    Ok(InitResponse::default())
}

pub(crate) fn handle<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>, env: Env, msg: HandleMsg,
) -> StdResult<HandleResponse> {
    Ok(HandleResponse::default())
}

pub(crate) fn query<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>, msg: QueryMsg,
) -> StdResult<Binary> {
    Ok(Binary(vec![]))
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use fadroma::platform::{
        do_handle, do_init, do_query, ExternalApi, ExternalQuerier, ExternalStorage,
    };
    #[no_mangle]
    extern "C" fn init(env_ptr: u32, msg_ptr: u32) -> u32 {
        do_init(
            &super::init::<ExternalStorage, ExternalApi, ExternalQuerier>,
            env_ptr,
            msg_ptr,
        )
    }
    #[no_mangle]
    extern "C" fn handle(env_ptr: u32, msg_ptr: u32) -> u32 {
        do_handle(
            &super::handle::<ExternalStorage, ExternalApi, ExternalQuerier>,
            env_ptr,
            msg_ptr,
        )
    }
    #[no_mangle]
    extern "C" fn query(msg_ptr: u32) -> u32 {
        do_query(
            &super::query::<ExternalStorage, ExternalApi, ExternalQuerier>,
            msg_ptr,
        )
    }
}
