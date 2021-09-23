use crate::{
    scrt::{
        HumanAddr, StdResult, InitResponse, HandleResponse,
        Extern, Env, Querier, Storage, Api, StdError, CanonicalAddr
    },
    derive_contract::{contract, init, handle, query}
};
use schemars;
use serde;

const ADMIN_KEY: &[u8] = b"ltp5P6sFZT";

#[contract]
pub trait Admin {
    #[init]
    fn new(admin: Option<HumanAddr>) -> StdResult<InitResponse> {
        let admin = if let Some(addr) = admin {
            addr
        } else {
            env.message.sender
        };

        save_admin(deps, &admin)?;

        Ok(InitResponse::default())
    }

    #[handle]
    fn change_admin(address: HumanAddr) -> StdResult<HandleResponse> {
        assert_admin(deps, &env)?;
        save_admin(deps, &address)?;
    
        Ok(HandleResponse::default())
    }

    #[query("address")]
    fn admin() -> StdResult<HumanAddr> {
        let address = load_admin(deps)?;

        Ok(address)
    }
}

pub fn load_admin<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>
) -> StdResult<HumanAddr> {
    let result = deps.storage.get(ADMIN_KEY);

    if let Some(bytes) = result {
        let admin = CanonicalAddr::from(bytes);

        deps.api.human_address(&admin)
    } else {
        Ok(HumanAddr::default())
    }
}

pub fn save_admin<S: Storage, A: Api, Q: Querier>(
    deps: &mut Extern<S, A, Q>,
    address: &HumanAddr
) -> StdResult<()> {
    let admin = deps.api.canonical_address(address)?;
    deps.storage.set(ADMIN_KEY, &admin.as_slice());

    Ok(())
}

pub fn assert_admin<S: Storage, A: Api, Q: Querier>(
    deps: &Extern<S, A, Q>,
    env: &Env
) -> StdResult<()> {
    let admin = load_admin(deps)?;

    if admin == env.message.sender {
        return Ok(());
    }

    Err(StdError::unauthorized())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::scrt::{mock_dependencies, mock_env};

    #[test]
    fn test_handle() {
        let ref mut deps = mock_dependencies(10, &[]);

        let admin = HumanAddr::from("admin");
        save_admin(deps, &admin).unwrap();

        let msg = HandleMsg::ChangeAdmin { 
            address: HumanAddr::from("will fail")
        };

        let result = handle(
            deps,
            mock_env("unauthorized", &[]),
            msg,
            DefaultImpl
        ).unwrap_err();
        
        match result {
            StdError::Unauthorized { .. } => { },
            _ => panic!("Expected \"StdError::Unauthorized\"")
        };

        let new_admin = HumanAddr::from("new_admin");

        let msg = HandleMsg::ChangeAdmin { 
            address: new_admin.clone()
        };

        handle(
            deps,
            mock_env(admin, &[]),
            msg,
            DefaultImpl
        ).unwrap();

        assert!(load_admin(deps).unwrap() == new_admin);
    }

    #[test]
    fn test_query() {
        let ref mut deps = mock_dependencies(10, &[]);

        let result = query(deps, QueryMsg::Admin {}, DefaultImpl).unwrap();

        match result {
            QueryResponse::Admin { address } => {
                assert!(address == HumanAddr::default());
            }
        }

        let admin = HumanAddr::from("admin");
        save_admin(deps, &admin).unwrap();

        let result = query(deps, QueryMsg::Admin {}, DefaultImpl).unwrap();

        match result {
            QueryResponse::Admin { address } => {
                assert!(address == admin);
            }
        }
    }
}