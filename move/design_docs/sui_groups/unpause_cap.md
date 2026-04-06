
<a name="sui_groups_unpause_cap"></a>

# Module `sui_groups::unpause_cap`

Module: unpause_cap

Capability required to unpause a <code>PermissionedGroup&lt;T&gt;</code>.
Returned by <code><a href="../sui_groups/permissioned_group.md#sui_groups_permissioned_group_pause">permissioned_group::pause</a>()</code>.

The phantom <code>T</code> scopes the cap to the group's package type —
a cap from one package's group cannot unpause a different package's group.


<a name="@Usage_0"></a>

### Usage


**Emergency fix pattern (PTB):**
```
let cap = group.pause(ctx);
// fix permissions in the same PTB
group.unpause(cap, ctx);
```

**Archive pattern:**
```
// get uid before pausing
let uid = group.object_uid_mut(&group_manager.id);
// attach ArchiveStamp as a permanent marker
dynamic_field::add(uid, ArchiveStamp(), true);
// pause and immediately burn the cap — unpause is now impossible
let cap = group.pause(ctx);
unpause_cap::burn(cap);
// Alternative: transfer::public_freeze_object(cap)
//   — makes the cap immutable and un-passable by value
```


    -  [Usage](#@Usage_0)
-  [Struct `UnpauseCap`](#sui_groups_unpause_cap_UnpauseCap)
-  [Function `new`](#sui_groups_unpause_cap_new)
-  [Function `group_id`](#sui_groups_unpause_cap_group_id)
-  [Function `delete`](#sui_groups_unpause_cap_delete)
-  [Function `burn`](#sui_groups_unpause_cap_burn)


<pre><code><b>use</b> <a href="../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
</code></pre>



<a name="sui_groups_unpause_cap_UnpauseCap"></a>

## Struct `UnpauseCap`

Owned capability required to unpause a <code>PermissionedGroup&lt;T&gt;</code>.
Has <code>store</code> so it can be wrapped or stored as a dynamic object field.


<pre><code><b>public</b> <b>struct</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a>&lt;<b>phantom</b> T&gt; <b>has</b> key, store
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
<code><a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_group_id">group_id</a>: <a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a></code>
</dt>
<dd>
 ID of the group this cap belongs to.
 Checked in <code><a href="../sui_groups/permissioned_group.md#sui_groups_permissioned_group_unpause">permissioned_group::unpause</a>()</code> to prevent cross-group misuse.
</dd>
</dl>


</details>

<a name="sui_groups_unpause_cap_new"></a>

## Function `new`

Creates a new <code><a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a></code> for the given group.
Called exclusively by <code><a href="../sui_groups/permissioned_group.md#sui_groups_permissioned_group_pause">permissioned_group::pause</a>()</code>.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_new">new</a>&lt;T&gt;(<a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_group_id">group_id</a>: <a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>): <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">sui_groups::unpause_cap::UnpauseCap</a>&lt;T&gt;
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_new">new</a>&lt;T&gt;(<a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_group_id">group_id</a>: ID, ctx: &<b>mut</b> TxContext): <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a>&lt;T&gt; {
    <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a> { id: object::new(ctx), <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_group_id">group_id</a> }
}
</code></pre>



</details>

<a name="sui_groups_unpause_cap_group_id"></a>

## Function `group_id`

Returns the group ID this cap belongs to.
Used by <code><a href="../sui_groups/permissioned_group.md#sui_groups_permissioned_group_unpause">permissioned_group::unpause</a>()</code> for mismatch check.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_group_id">group_id</a>&lt;T&gt;(cap: &<a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">sui_groups::unpause_cap::UnpauseCap</a>&lt;T&gt;): <a href="../dependencies/sui/object.md#sui_object_ID">sui::object::ID</a>
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_group_id">group_id</a>&lt;T&gt;(cap: &<a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a>&lt;T&gt;): ID {
    cap.<a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_group_id">group_id</a>
}
</code></pre>



</details>

<a name="sui_groups_unpause_cap_delete"></a>

## Function `delete`

Deletes the cap's UID, consuming it without unpausing.
Package-internal: only <code><a href="../sui_groups/permissioned_group.md#sui_groups_permissioned_group_unpause">permissioned_group::unpause</a>()</code> should call this.


<pre><code><b>public</b>(package) <b>fun</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_delete">delete</a>&lt;T&gt;(cap: <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">sui_groups::unpause_cap::UnpauseCap</a>&lt;T&gt;)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b>(package) <b>fun</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_delete">delete</a>&lt;T&gt;(cap: <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a>&lt;T&gt;) {
    <b>let</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a> { id, .. } = cap;
    id.<a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_delete">delete</a>();
}
</code></pre>



</details>

<a name="sui_groups_unpause_cap_burn"></a>

## Function `burn`

Burns the cap, making the group's pause permanent.
Call this to archive a group — once burned, unpause is impossible.

Alternative: <code>transfer::public_freeze_object(cap)</code> — makes the cap immutable
(cannot be passed by value to <code>unpause()</code>), also preventing unpause without destroying it.


<pre><code><b>public</b> <b>fun</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_burn">burn</a>&lt;T&gt;(cap: <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">sui_groups::unpause_cap::UnpauseCap</a>&lt;T&gt;)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_burn">burn</a>&lt;T&gt;(cap: <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a>&lt;T&gt;) {
    <b>let</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_UnpauseCap">UnpauseCap</a> { id, .. } = cap;
    id.<a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap_delete">delete</a>();
}
</code></pre>



</details>
