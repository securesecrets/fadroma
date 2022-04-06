#[cfg(all(feature = "scrt"))]
pub use fadroma_platform_scrt as platform;
pub use fadroma_platform_scrt::*;

#[cfg(all(feature = "declare"))]
pub use fadroma_declare_contract as declare_contract;
pub use fadroma_declare_contract::*;

#[cfg(all(feature = "derive"))]
pub use fadroma_derive_contract as derive_contract;

#[cfg(all(feature = "ensemble", not(target_arch = "wasm32")))]
pub use fadroma_ensemble as ensemble;
pub use fadroma_auth as auth;
pub use fadroma_auth::*;

pub use fadroma_auth_proc as auth_proc;
pub use fadroma_auth_proc::*;

#[cfg(all(feature = "compose"))]
pub use fadroma_composability as composability;
pub use fadroma_composability::*;

#[cfg(all(feature = "storage"))]
pub use fadroma_storage as storage;
pub use fadroma_storage::*;

pub use fadroma_killswitch as killswitch;

pub use fadroma_math as math;
pub use fadroma_math::*;

pub use fadroma_snip20_api::*;

#[cfg(all(feature = "snip20"))]
pub use fadroma_snip20_impl as snip20_impl;

pub use fadroma_storage as storage;
pub use fadroma_storage::*;
