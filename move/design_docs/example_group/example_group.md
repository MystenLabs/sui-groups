
<a name="example_group_example_group"></a>

# Module `example_group::example_group`

Module: example_group

Example package demonstrating how to extend <code>permissioned_groups</code>.


<a name="@Key_Patterns_Shown_0"></a>

### Key Patterns Shown


1. **Witness type**: <code><a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a></code> scopes permissions to this package.
   <code>new()</code> and <code>new_derived()</code> require a witness instance, so only the defining
   package can create groups of that type.

2. **Group creation wrappers**: <code><a href="../example_group/example_group.md#example_group_example_group_create_group">create_group</a>()</code> and <code><a href="../example_group/example_group.md#example_group_example_group_create_derived_group">create_derived_group</a>()</code> wrap
   the core <code>permissioned_group::new</code> and <code>new_derived</code> calls, proving ownership of
   the witness type.

3. **Extension permission**: <code><a href="../example_group/example_group.md#example_group_example_group_CustomMemberPermission">CustomMemberPermission</a></code> is a permission type defined
   outside <code>permissioned_groups</code>. It can be managed by <code>ExtensionPermissionsAdmin</code>
   (but NOT by <code>PermissionsAdmin</code>).

4. **Self-service actor**: <code><a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a></code> demonstrates the actor pattern — an on-chain
   object that holds permissions and lets users perform self-service operations.
   The actor's UID is passed to <code>object_grant_permission</code>, which checks that the
   actor has the required admin permission before granting to the sender.


    -  [Key Patterns Shown](#@Key_Patterns_Shown_0)
-  [Struct `ExampleGroupWitness`](#example_group_example_group_ExampleGroupWitness)
-  [Struct `CustomMemberPermission`](#example_group_example_group_CustomMemberPermission)
-  [Struct `JoinActor`](#example_group_example_group_JoinActor)
        -  [Usage](#@Usage_1)
-  [Constants](#@Constants_2)
-  [Function `create_group`](#example_group_example_group_create_group)
-  [Function `create_derived_group`](#example_group_example_group_create_derived_group)
-  [Function `new_join_actor`](#example_group_example_group_new_join_actor)
-  [Function `join_actor_address`](#example_group_example_group_join_actor_address)
-  [Function `share_join_actor`](#example_group_example_group_share_join_actor)
-  [Function `join`](#example_group_example_group_join)
-  [Function `leave`](#example_group_example_group_leave)


<pre><code><b>use</b> <a href="../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../dependencies/sui/accumulator_settlement.md#sui_accumulator_settlement">sui::accumulator_settlement</a>;
<b>use</b> <a href="../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../dependencies/sui/bcs.md#sui_bcs">sui::bcs</a>;
<b>use</b> <a href="../dependencies/sui/derived_object.md#sui_derived_object">sui::derived_object</a>;
<b>use</b> <a href="../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../dependencies/sui/event.md#sui_event">sui::event</a>;
<b>use</b> <a href="../dependencies/sui/hash.md#sui_hash">sui::hash</a>;
<b>use</b> <a href="../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
<b>use</b> <a href="../dependencies/sui/vec_set.md#sui_vec_set">sui::vec_set</a>;
<b>use</b> <a href="../dependencies/sui_groups/permissioned_group.md#sui_groups_permissioned_group">sui_groups::permissioned_group</a>;
<b>use</b> <a href="../dependencies/sui_groups/permissions_table.md#sui_groups_permissions_table">sui_groups::permissions_table</a>;
<b>use</b> <a href="../dependencies/sui_groups/unpause_cap.md#sui_groups_unpause_cap">sui_groups::unpause_cap</a>;
</code></pre>



<a name="example_group_example_group_ExampleGroupWitness"></a>

## Struct `ExampleGroupWitness`

Witness type scoping permissions to this package.
Uses PascalCase to avoid One-Time Witness convention (ALL_CAPS + matching module name).


<pre><code><b>public</b> <b>struct</b> <a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a> <b>has</b> drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="example_group_example_group_CustomMemberPermission"></a>

## Struct `CustomMemberPermission`

An extension permission defined outside the <code>permissioned_groups</code> package.
Managed by <code>ExtensionPermissionsAdmin</code>, not <code>PermissionsAdmin</code>.


<pre><code><b>public</b> <b>struct</b> <a href="../example_group/example_group.md#example_group_example_group_CustomMemberPermission">CustomMemberPermission</a> <b>has</b> drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="example_group_example_group_JoinActor"></a>

## Struct `JoinActor`

Actor object that enables self-service group joining.


<a name="@Usage_1"></a>

#### Usage

1. Admin creates the actor and grants it <code>ExtensionPermissionsAdmin</code> on the group.
2. The actor is shared so anyone can interact with it.
3. Users call <code><a href="../example_group/example_group.md#example_group_example_group_join">join</a>()</code> to grant themselves <code><a href="../example_group/example_group.md#example_group_example_group_CustomMemberPermission">CustomMemberPermission</a></code> through the actor.

In a real application, <code><a href="../example_group/example_group.md#example_group_example_group_join">join</a>()</code> could enforce payment, NFT ownership, cooldowns, etc.


<pre><code><b>public</b> <b>struct</b> <a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a> <b>has</b> key
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>group_id: <a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
 The group this actor is associated with.
</dd>
</dl>


</details>

<a name="@Constants_2"></a>

## Constants


<a name="example_group_example_group_EGroupMismatch"></a>



<pre><code><b>const</b> <a href="../example_group/example_group.md#example_group_example_group_EGroupMismatch">EGroupMismatch</a>: u64 = 0;
</code></pre>



<a name="example_group_example_group_create_group"></a>

## Function `create_group`

Creates a new <code>PermissionedGroup</code> scoped to <code><a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a></code>.
The caller (sender) becomes the initial admin with <code>PermissionsAdmin</code>,
<code>ExtensionPermissionsAdmin</code>, and <code>Destroyer</code> permissions.


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_create_group">create_group</a>(ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../dependencies/sui_groups/permissioned_group.md#sui_groups_permissioned_group_PermissionedGroup">sui_groups::permissioned_group::PermissionedGroup</a>&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">example_group::example_group::ExampleGroupWitness</a>&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_create_group">create_group</a>(ctx: &<b>mut</b> TxContext): PermissionedGroup&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a>&gt; {
    permissioned_group::new(<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a>(), ctx)
}
</code></pre>



</details>

<a name="example_group_example_group_create_derived_group"></a>

## Function `create_derived_group`

Creates a new derived <code>PermissionedGroup</code> with deterministic address.
Useful when you need a predictable group address (e.g., for Seal policies).


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_create_derived_group">create_derived_group</a>&lt;DerivationKey: <b>copy</b>, drop, store&gt;(derivation_uid: &<b>mut</b> <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a>, derivation_key: DerivationKey, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../dependencies/sui_groups/permissioned_group.md#sui_groups_permissioned_group_PermissionedGroup">sui_groups::permissioned_group::PermissionedGroup</a>&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">example_group::example_group::ExampleGroupWitness</a>&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_create_derived_group">create_derived_group</a>&lt;DerivationKey: <b>copy</b> + drop + store&gt;(
    derivation_uid: &<b>mut</b> UID,
    derivation_key: DerivationKey,
    ctx: &<b>mut</b> TxContext,
): PermissionedGroup&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a>&gt; {
    permissioned_group::new_derived(<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a>(), derivation_uid, derivation_key, ctx)
}
</code></pre>



</details>

<a name="example_group_example_group_new_join_actor"></a>

## Function `new_join_actor`

Creates a new <code><a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a></code> for the given group.
The returned object should be shared after granting it <code>ExtensionPermissionsAdmin</code>.


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_new_join_actor">new_join_actor</a>(group_id: <a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../example_group/example_group.md#example_group_example_group_JoinActor">example_group::example_group::JoinActor</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_new_join_actor">new_join_actor</a>(group_id: ID, ctx: &<b>mut</b> TxContext): <a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a> {
    <a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a> {
        id: object::new(ctx),
        group_id,
    }
}
</code></pre>



</details>

<a name="example_group_example_group_join_actor_address"></a>

## Function `join_actor_address`

Returns the actor's address (for granting permissions to it).


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_join_actor_address">join_actor_address</a>(actor: &<a href="../example_group/example_group.md#example_group_example_group_JoinActor">example_group::example_group::JoinActor</a>): <b>address</b>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_join_actor_address">join_actor_address</a>(actor: &<a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a>): <b>address</b> {
    actor.id.to_address()
}
</code></pre>



</details>

<a name="example_group_example_group_share_join_actor"></a>

## Function `share_join_actor`

Shares the actor object so anyone can call <code><a href="../example_group/example_group.md#example_group_example_group_join">join</a>()</code>.


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_share_join_actor">share_join_actor</a>(actor: <a href="../example_group/example_group.md#example_group_example_group_JoinActor">example_group::example_group::JoinActor</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_share_join_actor">share_join_actor</a>(actor: <a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a>) {
    transfer::share_object(actor);
}
</code></pre>



</details>

<a name="example_group_example_group_join"></a>

## Function `join`

Self-service join: sender grants themselves <code><a href="../example_group/example_group.md#example_group_example_group_CustomMemberPermission">CustomMemberPermission</a></code> through the actor.
Actor must have <code>ExtensionPermissionsAdmin</code> on the group.

In a real application, add custom logic before the grant (payment, gating, etc.).


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_join">join</a>(actor: &<a href="../example_group/example_group.md#example_group_example_group_JoinActor">example_group::example_group::JoinActor</a>, group: &<b>mut</b> <a href="../dependencies/sui_groups/permissioned_group.md#sui_groups_permissioned_group_PermissionedGroup">sui_groups::permissioned_group::PermissionedGroup</a>&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">example_group::example_group::ExampleGroupWitness</a>&gt;, ctx: &<a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_join">join</a>(
    actor: &<a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a>,
    group: &<b>mut</b> PermissionedGroup&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a>&gt;,
    ctx: &TxContext,
) {
    <b>assert</b>!(object::id(group) == actor.group_id, <a href="../example_group/example_group.md#example_group_example_group_EGroupMismatch">EGroupMismatch</a>);
    group.object_grant_permission&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a>, <a href="../example_group/example_group.md#example_group_example_group_CustomMemberPermission">CustomMemberPermission</a>&gt;(
        &actor.id,
        ctx.sender(),
    );
}
</code></pre>



</details>

<a name="example_group_example_group_leave"></a>

## Function `leave`

Self-service leave: sender revokes their <code><a href="../example_group/example_group.md#example_group_example_group_CustomMemberPermission">CustomMemberPermission</a></code> through the actor.
Actor must have <code>ExtensionPermissionsAdmin</code> on the group.


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_leave">leave</a>(actor: &<a href="../example_group/example_group.md#example_group_example_group_JoinActor">example_group::example_group::JoinActor</a>, group: &<b>mut</b> <a href="../dependencies/sui_groups/permissioned_group.md#sui_groups_permissioned_group_PermissionedGroup">sui_groups::permissioned_group::PermissionedGroup</a>&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">example_group::example_group::ExampleGroupWitness</a>&gt;, ctx: &<a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../example_group/example_group.md#example_group_example_group_leave">leave</a>(
    actor: &<a href="../example_group/example_group.md#example_group_example_group_JoinActor">JoinActor</a>,
    group: &<b>mut</b> PermissionedGroup&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a>&gt;,
    ctx: &TxContext,
) {
    <b>assert</b>!(object::id(group) == actor.group_id, <a href="../example_group/example_group.md#example_group_example_group_EGroupMismatch">EGroupMismatch</a>);
    group.object_revoke_permission&lt;<a href="../example_group/example_group.md#example_group_example_group_ExampleGroupWitness">ExampleGroupWitness</a>, <a href="../example_group/example_group.md#example_group_example_group_CustomMemberPermission">CustomMemberPermission</a>&gt;(
        &actor.id,
        ctx.sender(),
    );
}
</code></pre>



</details>
