<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['http://localhost:3000','http://127.0.0.1:3000'], true)) {
  header('Access-Control-Allow-Origin: '.$origin);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

const DB_HOST = '127.0.0.1';
const DB_NAME = 'acab_wcim';
const DB_USER = 'root';
const DB_PASS = '';
const SESSION_DAYS = 14;

function jsonResponse(bool $ok, mixed $data = null, string $error = '', int $status = 200): never {
  http_response_code($status);
  echo json_encode(['ok'=>$ok, 'data'=>$data, 'error'=>$error], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  $pdo = new PDO(
    'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4',
    DB_USER,
    DB_PASS,
    [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]
  );
} catch (Throwable $e) {
  jsonResponse(false, null, 'Database connection failed. Import database/acab_wcim.sql into XAMPP phpMyAdmin and check the DB credentials.', 500);
}

function body(): array {
  $raw = file_get_contents('php://input') ?: '';
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function now(): string { return gmdate('Y-m-d H:i:s'); }
function cleanId(): string { return bin2hex(random_bytes(16)); }
function sessionUser(PDO $pdo): ?array {
  $token = $_COOKIE['wcim_session'] ?? '';
  if (!$token) return null;
  $hash = hash('sha256', $token);
  $stmt = $pdo->prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1');
  $stmt->execute([$hash]);
  $user = $stmt->fetch() ?: null;
  if ($user) { $user['password'] = ''; }
  return $user ?: null;
}
function requireUser(PDO $pdo): array {
  $user = sessionUser($pdo);
  if (!$user) jsonResponse(false, null, 'You must be signed in.', 401);
  return $user;
}
function requireRole(PDO $pdo, array $roles): array {
  $user = requireUser($pdo);
  if (!in_array($user['role'], $roles, true)) jsonResponse(false, null, 'You do not have permission for this action.', 403);
  return $user;
}
function boolish(mixed $v): int { return ($v === true || $v === 1 || $v === '1') ? 1 : 0; }
function mapRow(string $entity, array $row): array {
  switch ($entity) {
    case 'accounts': return [
      'id'=>$row['id'],'name'=>$row['name'],'email'=>$row['email'],'password'=>'','role'=>$row['role'],'employeeId'=>$row['employee_id'],
      'status'=>$row['status'],'phone'=>$row['phone']??null,'avatarUrl'=>$row['avatar_url']??null,'notificationEmail'=>(bool)($row['notification_email']??1),'createdAt'=>$row['created_at'],'reviewedBy'=>$row['reviewed_by'],'reviewedAt'=>$row['reviewed_at']
    ];
    case 'materials': return ['id'=>$row['id'],'sku'=>$row['sku'],'name'=>$row['name'],'category'=>$row['category'],'unit'=>$row['unit'],'quantity'=>(float)$row['quantity'],'minimumStock'=>(float)$row['minimum_stock'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'categories': return ['id'=>$row['id'],'name'=>$row['name'],'description'=>$row['description'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'clients': return ['id'=>$row['id'],'accountId'=>$row['account_id'],'name'=>$row['name'],'email'=>$row['email'],'phone'=>$row['phone'],'company'=>$row['company'],'address'=>$row['address'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'suppliers': return ['id'=>$row['id'],'name'=>$row['name'],'contact'=>$row['contact'],'phone'=>$row['phone'],'email'=>$row['email'],'address'=>$row['address'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'inquiries': return ['id'=>$row['id'],'accountId'=>$row['account_id'],'project'=>$row['project'],'projectType'=>$row['project_type'],'location'=>$row['location'],'materials'=>$row['materials'],'quantity'=>$row['quantity'],'timeline'=>$row['timeline'],'notes'=>$row['notes'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'quotations': return ['id'=>$row['id'],'inquiryId'=>$row['inquiry_id'],'clientId'=>$row['client_id'],'accountId'=>$row['account_id'],'customerName'=>$row['customer_name'],'customerEmail'=>$row['customer_email']??null,'customerPhone'=>$row['customer_phone']??null,'projectName'=>$row['project_name'],'projectType'=>$row['project_type'],'location'=>$row['location'],'materials'=>$row['materials'],'quantity'=>$row['quantity'],'timeline'=>$row['timeline'],'notes'=>$row['notes'],'customerChangeRequest'=>$row['customer_change_request']??null,'status'=>$row['status'],'inventoryStatus'=>$row['inventory_status'],'checklistStatus'=>$row['checklist_status'],'confirmedAt'=>$row['confirmed_at'],'confirmationSentAt'=>$row['confirmation_sent_at'],'customerConfirmedAt'=>$row['customer_confirmed_at'],'orderId'=>$row['order_id'],'createdAt'=>$row['created_at']];
    case 'orders': return ['id'=>$row['id'],'orderNo'=>$row['order_no']??null,'quotationId'=>$row['quotation_id'],'inquiryId'=>$row['inquiry_id'],'clientId'=>$row['client_id'],'accountId'=>$row['account_id'],'projectName'=>$row['project_name'],'clientName'=>$row['client_name'],'materials'=>$row['materials'],'quantity'=>$row['quantity'],'status'=>$row['status'],'deliveryMethod'=>$row['delivery_method'],'deliveryAddressId'=>$row['delivery_address_id'],'paymentMethod'=>$row['payment_method'],'notes'=>$row['notes'],'confirmedAt'=>$row['confirmed_at'],'createdAt'=>$row['created_at']];
    case 'delivery_receipts': return ['id'=>$row['id'],'drNumber'=>$row['dr_number'],'orderNumber'=>$row['order_number'],'orderId'=>$row['order_id']??null,'deliveryMethod'=>$row['delivery_method']??null,'deliveryAddress'=>$row['delivery_address']??null,'paymentMethod'=>$row['payment_method']??null,'client'=>$row['client'],'items'=>$row['items'],'sku'=>$row['sku'],'quantity'=>(float)$row['quantity'],'date'=>$row['date'],'releasedBy'=>$row['released_by'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'stock_in': return ['id'=>$row['id'],'stockInId'=>$row['stock_in_id'],'reference'=>$row['stock_in_id'],'sku'=>$row['sku'],'material'=>$row['material'],'quantity'=>(float)$row['quantity'],'supplier'=>$row['supplier'],'receivedBy'=>$row['received_by'],'date'=>$row['date'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'stock_out': return ['id'=>$row['id'],'stockOutId'=>$row['stock_out_id'],'sku'=>$row['sku'],'material'=>$row['material'],'quantity'=>(float)$row['quantity'],'orderRef'=>$row['order_ref'],'destination'=>$row['destination'],'warehouseStaff'=>$row['warehouse_staff'],'date'=>$row['date'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'checklists': return ['id'=>$row['id'],'quotationId'=>$row['quotation_id']??null,'title'=>$row['title'],'status'=>$row['status'],'items'=>$row['items_json']?json_decode($row['items_json'],true):[],'createdAt'=>$row['created_at']];
    case 'checklist_items': return ['id'=>$row['id'],'checklistId'=>$row['checklist_id'],'label'=>$row['label'],'completed'=>boolish($row['completed']),'createdAt'=>$row['created_at']];
    case 'ledger_entries': return ['id'=>$row['id'],'source'=>$row['source'],'reference'=>$row['reference'],'description'=>$row['description'],'amount'=>(float)$row['amount'],'date'=>$row['date_value']?:$row['created_at'],'party'=>$row['party'],'project'=>$row['project'],'status'=>$row['status'],'sourceId'=>$row['source_id'],'createdAt'=>$row['created_at']];
    case 'notifications': return ['id'=>$row['id'],'audience'=>$row['audience'],'accountId'=>$row['account_id'],'title'=>$row['title'],'body'=>$row['body'],'createdAt'=>$row['created_at'],'read'=>!!$row['read_at'],'href'=>$row['href']];
    case 'transactions': return ['id'=>$row['id'],'orderId'=>$row['order_id'],'accountId'=>$row['account_id'],'actorUserId'=>$row['actor_user_id'],'actorRole'=>$row['actor_role'],'type'=>$row['type'],'status'=>$row['status'],'title'=>$row['title'],'message'=>$row['message'],'metadata'=>$row['metadata'] ? json_decode($row['metadata'], true) : null,'createdAt'=>$row['created_at']];
    case 'addresses': return ['id'=>$row['id'],'userId'=>$row['user_id'],'label'=>$row['label'],'recipientName'=>$row['recipient_name'],'phone'=>$row['phone'],'line1'=>$row['line1'],'line2'=>$row['line2'],'barangay'=>$row['barangay'],'city'=>$row['city'],'province'=>$row['province'],'postalCode'=>$row['postal_code'],'isDefault'=>!!$row['is_default'],'createdAt'=>$row['created_at']];
  }
  return $row;
}

$input = body();
$action = (string)($input['action'] ?? '');
$entity = (string)($input['entity'] ?? '');

if ($action === 'auth_me') {
  $me=sessionUser($pdo); jsonResponse(true, $me ? mapRow('accounts',$me) : null);
}
if ($action === 'auth_logout') {
  $token = $_COOKIE['wcim_session'] ?? '';
  if ($token) {
    $stmt=$pdo->prepare('DELETE FROM sessions WHERE token_hash=?'); $stmt->execute([hash('sha256',$token)]);
  }
  setcookie('wcim_session','',['expires'=>time()-3600,'path'=>'/','httponly'=>true,'samesite'=>'Lax']);
  jsonResponse(true, true);
}
if ($action === 'auth_register') {
  $name=trim((string)($input['name']??'')); $email=strtolower(trim((string)($input['email']??''))); $password=(string)($input['password']??''); $role=(string)($input['role']??'user');
  if (!$name || !$email || strlen($password)<6 || !in_array($role,['user','staff','admin'],true)) jsonResponse(false,null,'Please provide a valid name, email, password and role.',422);
  $check=$pdo->prepare('SELECT id FROM users WHERE email=?'); $check->execute([$email]); if ($check->fetch()) jsonResponse(false,null,'An account with this email already exists.',409);
  $prefix=$role==='admin'?'ADM':'EMP'; $base=$role==='admin'?1:1001;
  $num=$base; $stmt=$pdo->prepare("SELECT employee_id FROM users WHERE role=? AND employee_id IS NOT NULL AND employee_id LIKE ? ORDER BY employee_id DESC LIMIT 1"); $stmt->execute([$role,$prefix.'-%']);
  if ($last=$stmt->fetch()) { $num=max($base,(int)preg_replace('/[^0-9]/','',$last['employee_id'])+1); }
  $employee=($role==='user')?null:$prefix.'-'.str_pad((string)$num,4,'0',STR_PAD_LEFT); $id=cleanId(); $status=$role==='staff'?'pending':'active'; $n=now();
  $stmt=$pdo->prepare('INSERT INTO users (id,name,email,password_hash,role,employee_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)');
  $stmt->execute([$id,$name,$email,password_hash($password,PASSWORD_DEFAULT),$role,$employee,$status,$n,$n]);
  $row=$pdo->query("SELECT * FROM users WHERE id=".$pdo->quote($id))->fetch(); jsonResponse(true,mapRow('accounts',$row));
}
if ($action === 'auth_login') {
  $email=strtolower(trim((string)($input['email']??''))); $password=(string)($input['password']??''); $stmt=$pdo->prepare('SELECT * FROM users WHERE email=?'); $stmt->execute([$email]); $user=$stmt->fetch();
  if (!$user || !password_verify($password,$user['password_hash'])) jsonResponse(false,null,'Incorrect email or password.',401);
  if ($user['status']==='pending') jsonResponse(false,null,'This staff account is waiting for admin approval.',403);
  if ($user['status']==='rejected') jsonResponse(false,null,'This registration was rejected. Please contact an administrator.',403);
  $token=bin2hex(random_bytes(32)); $hash=hash('sha256',$token); $n=now(); $exp=gmdate('Y-m-d H:i:s',time()+SESSION_DAYS*86400); $st=$pdo->prepare('INSERT INTO sessions (user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?)'); $st->execute([$user['id'],$hash,$exp,$n]);
  setcookie('wcim_session',$token,['expires'=>time()+SESSION_DAYS*86400,'path'=>'/','httponly'=>true,'samesite'=>'Lax']);
  jsonResponse(true,mapRow('accounts',$user));
}
if ($action === 'auth_review') {
  $actor=requireRole($pdo,['admin']); $id=(string)($input['id']??''); $decision=(string)($input['decision']??'reject'); $n=now(); $status=$decision==='approve'?'active':'rejected';
  $st=$pdo->prepare('UPDATE users SET status=?, reviewed_by=?, reviewed_at=?, updated_at=? WHERE id=?'); $st->execute([$status,$actor['name'],$n,$n,$id]);
  $row=$pdo->prepare('SELECT * FROM users WHERE id=?'); $row->execute([$id]); $r=$row->fetch(); if (!$r) jsonResponse(false,null,'Account not found.',404); jsonResponse(true,mapRow('accounts',$r));
}

$allowed = ['clients','materials','categories','suppliers','inquiries','quotations','orders','delivery_receipts','stock_in','stock_out','checklists','checklist_items','ledger_entries','notifications','transactions','addresses','accounts'];
$entitylessActions=['transaction_status','confirm_stock_out','request_quotation_changes','confirm_quotation_order'];
if (!in_array($action,$entitylessActions,true) && !in_array($entity,$allowed,true)) jsonResponse(false,null,'Unknown entity.',400);

$current=sessionUser($pdo);
if ($action==='list') {
  if (!$current && $entity!=='materials' && $entity!=='categories') requireUser($pdo);
  if ($entity==='accounts') requireRole($pdo,['admin']);
  $tables=['accounts'=>'users','clients'=>'clients','materials'=>'materials','categories'=>'categories','suppliers'=>'suppliers','inquiries'=>'inquiries','quotations'=>'quotations','orders'=>'orders','delivery_receipts'=>'delivery_receipts','stock_in'=>'stock_in','stock_out'=>'stock_out','checklists'=>'checklists','checklist_items'=>'checklist_items','ledger_entries'=>'ledger_entries','notifications'=>'notifications','transactions'=>'transactions','addresses'=>'addresses'];
  $table=$tables[$entity]; $sql="SELECT * FROM `$table`"; $params=[];
  if ($entity==='notifications' && $current) { $sql.=' WHERE (audience=:audience OR audience=:all) AND (account_id IS NULL OR account_id=:account_id)'; $params['audience']=$current['role']; $params['all']='all'; $params['account_id']=$current['id']; }
  elseif ($entity==='addresses' && $current) { $sql.=' WHERE user_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='clients' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='inquiries' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='quotations' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='orders' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='delivery_receipts' && $current && $current['role']==='user') { $sql.=' WHERE order_id IN (SELECT id FROM orders WHERE account_id=:uid)'; $params['uid']=$current['id']; }
  elseif ($entity==='transactions' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  $sql.=' ORDER BY created_at DESC'; $stmt=$pdo->prepare($sql); $stmt->execute($params); $rows=array_map(fn($r)=>mapRow($entity,$r),$stmt->fetchAll()); jsonResponse(true,$rows);
}

$current=requireUser($pdo);
$actorRoles=['accounts'=>['admin'],'materials'=>['admin','staff'],'categories'=>['admin','staff'],'suppliers'=>['admin','staff'],'clients'=>['admin','staff'],'inquiries'=>['admin','staff','user'],'quotations'=>['admin','staff'],'orders'=>['admin','staff'],'delivery_receipts'=>['admin','staff'],'stock_in'=>['admin','staff'],'stock_out'=>['admin','staff'],'checklists'=>['admin','staff'],'checklist_items'=>['admin','staff'],'ledger_entries'=>['admin','staff'],'notifications'=>['admin','staff','user'],'transactions'=>['admin','staff','user'],'addresses'=>['admin','staff','user']];
// Customers may only CREATE their own quotation requests and client profile; everything else stays staff/admin.
$userCreateOnly=['quotations','clients'];
$isUserCreate=($action==='create' && $current['role']==='user' && in_array($entity,$userCreateOnly,true));
$isUserUpdate=($action==='update' && $current['role']==='user' && $entity==='accounts');
if ($action!=='auth_review' && !in_array($action,$entitylessActions,true) && !$isUserCreate && !$isUserUpdate && !in_array($current['role'],$actorRoles[$entity]??[],true)) jsonResponse(false,null,'You do not have permission for this entity.',403);

$tables=['accounts'=>'users','clients'=>'clients','materials'=>'materials','categories'=>'categories','suppliers'=>'suppliers','inquiries'=>'inquiries','quotations'=>'quotations','orders'=>'orders','delivery_receipts'=>'delivery_receipts','stock_in'=>'stock_in','stock_out'=>'stock_out','checklists'=>'checklists','checklist_items'=>'checklist_items','ledger_entries'=>'ledger_entries','notifications'=>'notifications','transactions'=>'transactions','addresses'=>'addresses'];
$table=$tables[$entity]??null;

function val(array $r,string $key,mixed $default=null): mixed { return array_key_exists($key,$r)?$r[$key]:$default; }

// Next human-readable number such as ORD-2026-0001 or DR-2026-0001 (resets each year).
function nextNumber(PDO $pdo,string $table,string $col,string $prefix): string {
  $year=gmdate('Y');
  $st=$pdo->prepare("SELECT MAX(CAST(SUBSTRING_INDEX(`$col`,'-',-1) AS UNSIGNED)) FROM `$table` WHERE `$col` LIKE ?");
  $st->execute(["$prefix-$year-%"]);
  return sprintf('%s-%s-%04d',$prefix,$year,((int)$st->fetchColumn())+1);
}

// Gives an order its ORD number (retries if two orders race for the same number).
function assignOrderNumber(PDO $pdo,string $orderId): void {
  for ($i=0;$i<5;$i++) {
    try {
      $no=nextNumber($pdo,'orders','order_no','ORD');
      $up=$pdo->prepare('UPDATE orders SET order_no=? WHERE id=? AND order_no IS NULL'); $up->execute([$no,$orderId]); return;
    } catch (PDOException $e) { if ($e->getCode()!=='23000') throw $e; }
  }
}

// Creates the delivery receipt for an order, or refreshes it from the order's current data.
function syncDeliveryReceipt(PDO $pdo,string $orderId): void {
  $st=$pdo->prepare('SELECT * FROM orders WHERE id=?'); $st->execute([$orderId]); $o=$st->fetch(); if (!$o) return;
  $addr=null;
  if (!empty($o['delivery_address_id'])) {
    $a=$pdo->prepare('SELECT * FROM addresses WHERE id=?'); $a->execute([$o['delivery_address_id']]); $ar=$a->fetch();
    if ($ar) $addr=implode(', ',array_filter([$ar['recipient_name'],$ar['line1'],$ar['line2'],$ar['barangay'],$ar['city'],$ar['province'],$ar['postal_code']]));
  }
  $orderNo=$o['order_no'] ?: $o['id'];
  $map=['Released'=>'Released','Delivered'=>'Delivered'];
  $f=$pdo->prepare('SELECT * FROM delivery_receipts WHERE order_id=? OR order_number=? OR order_number=? LIMIT 1'); $f->execute([$o['id'],$o['id'],$orderNo]); $dr=$f->fetch();
  $n=now();
  if (!$dr) {
    $ins=$pdo->prepare('INSERT INTO delivery_receipts (id,dr_number,order_number,order_id,client,items,sku,quantity,date,released_by,status,delivery_method,delivery_address,payment_method,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $ins->execute([cleanId(),nextNumber($pdo,'delivery_receipts','dr_number','DR'),$orderNo,$o['id'],$o['client_name'],$o['materials'],'',(float)$o['quantity'],gmdate('Y-m-d'),'System',$map[$o['status']]??'Draft',$o['delivery_method'],$addr,$o['payment_method'],$n,$n]);
  } else {
    $status=$map[$o['status']]??$dr['status'];
    $up=$pdo->prepare('UPDATE delivery_receipts SET order_number=?,order_id=?,client=?,items=?,quantity=?,status=?,delivery_method=?,delivery_address=?,payment_method=?,updated_at=? WHERE id=?');
    $up->execute([$orderNo,$o['id'],$o['client_name'],$o['materials'],(float)$o['quantity'],$status,$o['delivery_method'],$addr,$o['payment_method'],$n,$dr['id']]);
  }
}

if ($action==='request_quotation_changes') {
  $actor=requireRole($pdo,['user']);
  $id=trim((string)($input['quotationId']??''));
  $message=trim((string)($input['message']??''));
  if ($id==='' || $message==='') jsonResponse(false,null,'Quotation and change details are required.',422);
  try {
    $pdo->beginTransaction();
    $st=$pdo->prepare('SELECT * FROM quotations WHERE id=? FOR UPDATE'); $st->execute([$id]); $q=$st->fetch();
    if (!$q || (string)$q['account_id']!==(string)$actor['id']) { $pdo->rollBack(); jsonResponse(false,null,'You do not have permission to change this quotation.',403); }
    if ($q['status']!=='confirmed' || !empty($q['customer_confirmed_at']) || !empty($q['order_id'])) { $pdo->rollBack(); jsonResponse(false,null,'Only an unconfirmed quotation ready for your approval can be revised.',409); }
    $n=now();
    $up=$pdo->prepare("UPDATE quotations SET customer_change_request=?,status='changes-requested',checklist_status='Pending Review',confirmed_at=NULL,confirmation_sent_at=NULL,updated_at=? WHERE id=?");
    $up->execute([substr($message,0,4000),$n,$id]);
    $cl=$pdo->prepare('SELECT id,items_json FROM checklists WHERE quotation_id=? FOR UPDATE'); $cl->execute([$id]); $checklist=$cl->fetch();
    if ($checklist) {
      $items=json_decode((string)$checklist['items_json'],true); if (!is_array($items)) $items=[];
      foreach ($items as &$item) { if (is_array($item)) $item['completed']=false; } unset($item);
      $reset=$pdo->prepare("UPDATE checklists SET status='Checklist Pending',items_json=?,updated_at=? WHERE id=?");
      $reset->execute([json_encode($items,JSON_UNESCAPED_UNICODE),$n,$checklist['id']]);
    }
    $st=$pdo->prepare('SELECT * FROM quotations WHERE id=?'); $st->execute([$id]); $row=$st->fetch();
    $pdo->commit();
    jsonResponse(true,mapRow('quotations',$row));
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(false,null,$e->getMessage(),422);
  }
}

if ($action==='confirm_quotation_order') {
  $actor=requireRole($pdo,['user']);
  $quotationId=trim((string)($input['quotationId']??''));
  if ($quotationId==='') jsonResponse(false,null,'Quotation id is required.',422);
  $deliveryMethod=trim((string)($input['deliveryMethod']??'Delivery'));
  $deliveryAddressId=trim((string)($input['deliveryAddressId']??'')) ?: null;
  $paymentMethod=trim((string)($input['paymentMethod']??'Cash on delivery'));
  try {
    $pdo->beginTransaction();
    $st=$pdo->prepare('SELECT * FROM quotations WHERE id=? FOR UPDATE'); $st->execute([$quotationId]); $q=$st->fetch();
    if (!$q || (string)$q['account_id']!==(string)$actor['id']) { $pdo->rollBack(); jsonResponse(false,null,'You do not have permission to confirm this quotation.',403); }
    if ($q['status']!=='confirmed') { $pdo->rollBack(); jsonResponse(false,null,'Staff must approve the latest quotation before you can confirm it.',409); }
    if (!empty($q['customer_confirmed_at']) && !empty($q['order_id'])) {
      $existing=$pdo->prepare('SELECT * FROM orders WHERE id=?'); $existing->execute([$q['order_id']]); $order=$existing->fetch();
      if ($order) { $pdo->commit(); jsonResponse(true,mapRow('orders',$order)); }
    }
    if ($deliveryMethod==='Delivery' && !$deliveryAddressId) { $pdo->rollBack(); jsonResponse(false,null,'Choose a delivery address before confirming.',422); }
    if ($deliveryAddressId) {
      $address=$pdo->prepare('SELECT id FROM addresses WHERE id=? AND user_id=?'); $address->execute([$deliveryAddressId,$actor['id']]);
      if (!$address->fetch()) { $pdo->rollBack(); jsonResponse(false,null,'The selected address does not belong to your account.',403); }
    }
    $n=now(); $orderId=(string)($q['order_id']??'');
    if ($orderId!=='') {
      $existing=$pdo->prepare('SELECT * FROM orders WHERE id=? FOR UPDATE'); $existing->execute([$orderId]); $order=$existing->fetch();
    }
    if (empty($order)) {
      $orderId=cleanId();
      $ins=$pdo->prepare('INSERT INTO orders (id,quotation_id,inquiry_id,client_id,account_id,project_name,client_name,materials,quantity,status,delivery_method,delivery_address_id,payment_method,notes,confirmed_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
      $ins->execute([$orderId,$q['id'],$q['inquiry_id'],$q['client_id'],$q['account_id'],$q['project_name'],$q['customer_name']?:'Customer',$q['materials'],$q['quantity'],'Confirmed',$deliveryMethod,$deliveryAddressId,$paymentMethod,$q['notes'],$n,$n,$n]);
      assignOrderNumber($pdo,$orderId);
    } else {
      $up=$pdo->prepare("UPDATE orders SET project_name=?,client_name=?,materials=?,quantity=?,status='Confirmed',delivery_method=?,delivery_address_id=?,payment_method=?,notes=?,confirmed_at=?,updated_at=? WHERE id=?");
      $up->execute([$q['project_name'],$q['customer_name']?:'Customer',$q['materials'],$q['quantity'],$deliveryMethod,$deliveryAddressId,$paymentMethod,$q['notes'],$n,$n,$orderId]);
    }
    $up=$pdo->prepare('UPDATE quotations SET customer_confirmed_at=?,order_id=?,updated_at=? WHERE id=?'); $up->execute([$n,$orderId,$n,$quotationId]);
    $st=$pdo->prepare('SELECT * FROM orders WHERE id=?'); $st->execute([$orderId]); $order=$st->fetch();
    $pdo->commit();
    try { syncDeliveryReceipt($pdo,$orderId); } catch (Throwable $e) { /* The confirmed order remains saved if receipt generation fails. */ }
    jsonResponse(true,mapRow('orders',$order));
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(false,null,$e->getMessage(),422);
  }
}

if ($action==='create') {
  $r=$input['record']??[]; if (!is_array($r)) jsonResponse(false,null,'Invalid record.',422); if ($current['role']==='user' && in_array($entity,['quotations','clients'],true)) $r['accountId']=$current['id']; $id=(string)($r['id']??cleanId()); $n=now();
  try {
    switch ($entity) {
      case 'accounts': jsonResponse(false,null,'Use registration to create accounts.',405);
      case 'materials': $st=$pdo->prepare('INSERT INTO materials (id,sku,name,category,unit,quantity,minimum_stock,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'sku'),val($r,'name'),val($r,'category'),val($r,'unit'),val($r,'quantity',0),val($r,'minimumStock',0),val($r,'status','Available'),val($r,'createdAt',$n),$n]); break;
      case 'categories': $st=$pdo->prepare('INSERT INTO categories (id,name,description,status,created_at,updated_at) VALUES (?,?,?,?,?,?)'); $st->execute([$id,val($r,'name'),val($r,'description'),val($r,'status','active'),val($r,'createdAt',$n),$n]); break;
      case 'clients': $st=$pdo->prepare('INSERT INTO clients (id,account_id,name,email,phone,company,address,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'accountId'),val($r,'name'),val($r,'email'),val($r,'phone'),val($r,'company'),val($r,'address'),val($r,'status','active'),val($r,'createdAt',$n),$n]); break;
      case 'suppliers': $st=$pdo->prepare('INSERT INTO suppliers (id,name,contact,phone,email,address,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'name'),val($r,'contact'),val($r,'phone'),val($r,'email'),val($r,'address'),val($r,'status','active'),$n]); break;
      case 'inquiries': $st=$pdo->prepare('INSERT INTO inquiries (id,account_id,project,project_type,location,materials,quantity,timeline,notes,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'accountId',$current['id']),val($r,'project'),val($r,'projectType'),val($r,'location'),val($r,'materials'),val($r,'quantity'),val($r,'timeline'),val($r,'notes'),val($r,'status','pending'),val($r,'createdAt',$n),$n]); break;
      case 'quotations': $st=$pdo->prepare('INSERT INTO quotations (id,inquiry_id,client_id,account_id,customer_name,customer_email,customer_phone,project_name,project_type,location,materials,quantity,timeline,notes,status,inventory_status,checklist_status,confirmed_at,confirmation_sent_at,customer_confirmed_at,order_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'inquiryId'),val($r,'clientId'),val($r,'accountId'),val($r,'customerName'),val($r,'customerEmail'),val($r,'customerPhone'),val($r,'projectName'),val($r,'projectType'),val($r,'location'),val($r,'materials'),val($r,'quantity'),val($r,'timeline'),val($r,'notes'),val($r,'status','pending'),val($r,'inventoryStatus'),val($r,'checklistStatus'),val($r,'confirmedAt'),val($r,'confirmationSentAt'),val($r,'customerConfirmedAt'),val($r,'orderId'),val($r,'createdAt',$n),$n]); break;
      case 'orders': $st=$pdo->prepare('INSERT INTO orders (id,quotation_id,inquiry_id,client_id,account_id,project_name,client_name,materials,quantity,status,delivery_method,delivery_address_id,payment_method,notes,confirmed_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'quotationId'),val($r,'inquiryId'),val($r,'clientId'),val($r,'accountId',$current['role']==='user'?$current['id']:null),val($r,'projectName'),val($r,'clientName'),val($r,'materials'),val($r,'quantity'),val($r,'status','Pending'),val($r,'deliveryMethod'),val($r,'deliveryAddressId'),val($r,'paymentMethod'),val($r,'notes'),val($r,'confirmedAt'),val($r,'createdAt',$n),$n]); break;
      case 'delivery_receipts': $st=$pdo->prepare('INSERT INTO delivery_receipts (id,dr_number,order_number,client,items,sku,quantity,date,released_by,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'drNumber'),val($r,'orderNumber'),val($r,'client'),val($r,'items'),val($r,'sku',''),val($r,'quantity',0),val($r,'date',gmdate('Y-m-d')),$current['name'],val($r,'status','Draft'),val($r,'createdAt',$n),$n]); break;
      case 'stock_in': $st=$pdo->prepare('INSERT INTO stock_in (id,stock_in_id,sku,material,quantity,supplier,received_by,date,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'stockInId'),val($r,'sku'),val($r,'material'),val($r,'quantity',0),val($r,'supplier'),val($r,'receivedBy'),val($r,'date',gmdate('Y-m-d')),val($r,'status','Confirmed'),val($r,'createdAt',$n),$n]); break;
      case 'stock_out': $st=$pdo->prepare('INSERT INTO stock_out (id,stock_out_id,sku,material,quantity,order_ref,destination,warehouse_staff,date,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'stockOutId'),val($r,'sku'),val($r,'material'),val($r,'quantity',0),val($r,'orderRef'),val($r,'destination'),val($r,'warehouseStaff'),val($r,'date',gmdate('Y-m-d')),val($r,'status','Draft'),val($r,'createdAt',$n),$n]); break;
      case 'checklists': $st=$pdo->prepare('INSERT INTO checklists (id,quotation_id,title,status,items_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'quotationId'),val($r,'title'),val($r,'status','Checklist Pending'),isset($r['items'])?json_encode($r['items']):'[]',val($r,'createdAt',$n),$n]); break;
      case 'checklist_items': $st=$pdo->prepare('INSERT INTO checklist_items (id,checklist_id,label,completed,created_at,updated_at) VALUES (?,?,?,?,?,?)'); $st->execute([$id,val($r,'checklistId'),val($r,'label'),boolish(val($r,'completed')),val($r,'createdAt',$n),$n]); break;
      case 'ledger_entries': $st=$pdo->prepare('INSERT INTO ledger_entries (id,type,reference,description,amount,date_value,party,project,status,source,source_id,debit,credit,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'type','Project Transaction'),val($r,'reference'),val($r,'description'),val($r,'amount',0),val($r,'date',gmdate('Y-m-d')),val($r,'party'),val($r,'project'),val($r,'status','Posted'),val($r,'source'),val($r,'sourceId'),val($r,'debit',0),val($r,'credit',0),val($r,'balance',0),val($r,'createdAt',$n),$n]); break;
      case 'notifications': $st=$pdo->prepare('INSERT INTO notifications (id,audience,account_id,title,body,created_at,read_at,href) VALUES (?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'audience'),val($r,'accountId'),val($r,'title'),val($r,'body'),val($r,'createdAt',$n),val($r,'read')? $n:null,val($r,'href')]); break;
      case 'transactions': $st=$pdo->prepare('INSERT INTO transactions (id,order_id,account_id,actor_user_id,actor_role,type,status,title,message,metadata,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'orderId'),val($r,'accountId',$current['role']==='user'?$current['id']:null),val($r,'actorUserId',$current['id']),val($r,'actorRole',$current['role']),val($r,'type'),val($r,'status'),val($r,'title'),val($r,'message'),isset($r['metadata'])?json_encode($r['metadata']):null,val($r,'createdAt',$n)]); break;
      case 'addresses': $st=$pdo->prepare('INSERT INTO addresses (id,user_id,label,recipient_name,phone,line1,line2,barangay,city,province,postal_code,is_default,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'userId',$current['id']),val($r,'label','Primary'),val($r,'recipientName',$current['name']),val($r,'phone'),val($r,'line1'),val($r,'line2'),val($r,'barangay'),val($r,'city'),val($r,'province'),val($r,'postalCode'),boolish(val($r,'isDefault')),val($r,'createdAt',$n),$n]); break;
    }
    if ($entity==='orders') {
      try { assignOrderNumber($pdo,$id); syncDeliveryReceipt($pdo,$id); } catch (Throwable $e) { /* never block the order */ }
    }
    if ($entity==='stock_in') {
      $mat=$pdo->prepare('SELECT * FROM materials WHERE sku=? OR LOWER(name)=LOWER(?) LIMIT 1'); $mat->execute([val($r,'sku'),val($r,'material')]); $m=$mat->fetch();
      if ($m) { $qty=(float)$m['quantity']+(float)val($r,'quantity',0); $status=$qty <= (float)$m['minimum_stock'] ? 'Limited' : 'Available'; $up=$pdo->prepare('UPDATE materials SET quantity=?,status=?,updated_at=? WHERE id=?'); $up->execute([$qty,$status,now(),$m['id']]); }
    }
    $st=$pdo->prepare("SELECT * FROM `$table` WHERE id=?"); $st->execute([$id]); $row=$st->fetch(); if (!$row) jsonResponse(false,null,'Record could not be created.',500); jsonResponse(true,mapRow($entity,$row));
  } catch (Throwable $e) { jsonResponse(false,null,$e->getMessage(),422); }
}

if ($action==='update') {
  $id=(string)($input['id']??''); $patch=$input['patch']??[]; if (!$id || !is_array($patch)) jsonResponse(false,null,'Invalid update.',422); $columns=[
    'materials'=>['sku'=>'sku','name'=>'name','category'=>'category','unit'=>'unit','quantity'=>'quantity','minimumStock'=>'minimum_stock','status'=>'status'],
    'categories'=>['name'=>'name','description'=>'description','status'=>'status'], 'clients'=>['accountId'=>'account_id','name'=>'name','email'=>'email','phone'=>'phone','company'=>'company','address'=>'address','status'=>'status'], 'suppliers'=>['name'=>'name','contact'=>'contact','phone'=>'phone','email'=>'email','address'=>'address','status'=>'status'],
    'inquiries'=>['accountId'=>'account_id','project'=>'project','projectType'=>'project_type','location'=>'location','materials'=>'materials','quantity'=>'quantity','timeline'=>'timeline','notes'=>'notes','status'=>'status'],
    'quotations'=>['inquiryId'=>'inquiry_id','clientId'=>'client_id','accountId'=>'account_id','customerName'=>'customer_name','customerEmail'=>'customer_email','customerPhone'=>'customer_phone','projectName'=>'project_name','projectType'=>'project_type','location'=>'location','materials'=>'materials','quantity'=>'quantity','timeline'=>'timeline','notes'=>'notes','customerChangeRequest'=>'customer_change_request','status'=>'status','inventoryStatus'=>'inventory_status','checklistStatus'=>'checklist_status','confirmedAt'=>'confirmed_at','confirmationSentAt'=>'confirmation_sent_at','customerConfirmedAt'=>'customer_confirmed_at','orderId'=>'order_id'],
    'orders'=>['quotationId'=>'quotation_id','inquiryId'=>'inquiry_id','clientId'=>'client_id','accountId'=>'account_id','projectName'=>'project_name','clientName'=>'client_name','materials'=>'materials','quantity'=>'quantity','status'=>'status','deliveryMethod'=>'delivery_method','deliveryAddressId'=>'delivery_address_id','paymentMethod'=>'payment_method','notes'=>'notes','confirmedAt'=>'confirmed_at'],
    'delivery_receipts'=>['drNumber'=>'dr_number','orderNumber'=>'order_number','client'=>'client','items'=>'items','sku'=>'sku','quantity'=>'quantity','date'=>'date','releasedBy'=>'released_by','status'=>'status'],
    'stock_in'=>['stockInId'=>'stock_in_id','reference'=>'stock_in_id','sku'=>'sku','material'=>'material','quantity'=>'quantity','supplier'=>'supplier','receivedBy'=>'received_by','date'=>'date','status'=>'status'],
    'stock_out'=>['stockOutId'=>'stock_out_id','sku'=>'sku','material'=>'material','quantity'=>'quantity','orderRef'=>'order_ref','destination'=>'destination','warehouseStaff'=>'warehouse_staff','date'=>'date','status'=>'status'],
    'checklists'=>['quotationId'=>'quotation_id','title'=>'title','status'=>'status','items'=>'items_json'], 'checklist_items'=>['checklistId'=>'checklist_id','label'=>'label','completed'=>'completed'],
    'ledger_entries'=>['type'=>'type','reference'=>'reference','description'=>'description','debit'=>'debit','credit'=>'credit','balance'=>'balance','source'=>'source','sourceId'=>'source_id'],
    'notifications'=>['title'=>'title','body'=>'body','href'=>'href','read'=>'read_at'],
    'transactions'=>['status'=>'status','title'=>'title','message'=>'message','metadata'=>'metadata'],
    'addresses'=>['label'=>'label','recipientName'=>'recipient_name','phone'=>'phone','line1'=>'line1','line2'=>'line2','barangay'=>'barangay','city'=>'city','province'=>'province','postalCode'=>'postal_code','isDefault'=>'is_default'],
  ];
  if ($entity==='accounts') {
    $allowedPatch=['name','phone','avatarUrl','notificationEmail','status','reviewedBy','reviewedAt']; if ($current['role']!=='admin' && ((string)$id!==$current['id'] || array_diff(array_keys($patch),['name','phone','avatarUrl','notificationEmail']))) jsonResponse(false,null,'Account update not allowed.',403);
    if ($current['role']!=='admin') $allowedPatch=['name','phone','avatarUrl','notificationEmail'];
    $mapped=['name'=>'name','phone'=>'phone','avatarUrl'=>'avatar_url','notificationEmail'=>'notification_email','status'=>'status','reviewedBy'=>'reviewed_by','reviewedAt'=>'reviewed_at'];
  } else $mapped=$columns[$entity]??[];
  if ($current['role']==='user' && in_array($entity,['quotations','orders'],true)) {
    $own=$pdo->prepare('SELECT account_id FROM `'.$tables[$entity].'` WHERE id=?'); $own->execute([$id]); $ownRow=$own->fetch();
    if (!$ownRow || (string)$ownRow['account_id']!==(string)$current['id']) jsonResponse(false,null,'You do not have permission to change this record.',403);
    if ($entity==='quotations') $patch=array_intersect_key($patch,array_flip(['customerConfirmedAt','orderId']));
    if ($entity==='orders') {
      $patch=array_intersect_key($patch,array_flip(['deliveryMethod','deliveryAddressId','paymentMethod','status']));
      $cur=$pdo->prepare('SELECT status FROM orders WHERE id=?'); $cur->execute([$id]); $curStatus=(string)$cur->fetchColumn();
      if (isset($patch['status']) && ($patch['status']!=='Cancelled' || in_array($curStatus,['Released','Delivered'],true))) unset($patch['status']);
    }
  }
  $sets=[];$params=[];
  foreach($patch as $k=>$v){ if(!isset($mapped[$k])) continue; $sets[]='`'.$mapped[$k].'`=?'; if($entity==='notifications' && $k==='read') $v=$v?now():null; if(in_array($k,['completed','isDefault','notificationEmail'],true)) $v=boolish($v); if($k==='metadata' || $k==='items') $v=json_encode($v); $params[]=$v; }
  if (!$sets) jsonResponse(false,null,'No editable fields supplied.',422); if (!in_array($entity,['notifications','transactions'],true)) { $sets[]='updated_at=?'; $params[]=now(); } $params[]=$id;
  $st=$pdo->prepare("UPDATE `$table` SET ".implode(',',$sets)." WHERE id=?"); $st->execute($params); if ($entity==='orders') { try { syncDeliveryReceipt($pdo,$id); } catch (Throwable $e) {} } $st=$pdo->prepare("SELECT * FROM `$table` WHERE id=?"); $st->execute([$id]); $row=$st->fetch(); if(!$row) jsonResponse(false,null,'Record not found.',404); jsonResponse(true,mapRow($entity,$row));
}

if ($action==='delete') {
  $id=(string)($input['id']??'');
  if (!$id) jsonResponse(false,null,'Record id is required.',422);
  $st=$pdo->prepare("DELETE FROM `$table` WHERE id=?"); $st->execute([$id]);
  $message="Deleted $entity record $id."; $audit=$pdo->prepare('INSERT INTO audit_logs (actor_user_id,entity,entity_id,action,message,created_at) VALUES (?,?,?,?,?,?)'); $audit->execute([$current['id'],$entity,$id,'delete',$message,now()]);
  foreach (['admin','staff'] as $audience) { $nid=cleanId(); $nt=$pdo->prepare('INSERT INTO notifications (id,audience,title,body,created_at,href) VALUES (?,?,?,?,?,?)'); $nt->execute([$nid,$audience,'Record deleted',ucfirst(str_replace('_',' ',$entity))." $id was deleted by {$current['name']}.",now(),null]); }
  jsonResponse(true,true);
}

if ($action==='confirm_stock_out') {
  $actor=requireRole($pdo,['admin','staff']); $id=(string)($input['id']??'');
  $st=$pdo->prepare('SELECT * FROM stock_out WHERE id=? FOR UPDATE'); $pdo->beginTransaction(); $st->execute([$id]); $item=$st->fetch();
  if (!$item) { $pdo->rollBack(); jsonResponse(false,null,'Stock-out record not found.',404); }
  if ($item['status']==='Confirmed') { $pdo->commit(); jsonResponse(true,mapRow('stock_out',$item)); }
  $mat=$pdo->prepare('SELECT * FROM materials WHERE sku=? OR LOWER(name)=LOWER(?) LIMIT 1 FOR UPDATE'); $mat->execute([$item['sku'],$item['material']]); $m=$mat->fetch();
  if (!$m || (float)$m['quantity'] < (float)$item['quantity']) { $pdo->rollBack(); jsonResponse(false,null,'Not enough available inventory for this stock-out.',422); }
  $qty=(float)$m['quantity']-(float)$item['quantity']; $status=$qty <= (float)$m['minimum_stock'] ? 'Limited' : 'Available'; $up=$pdo->prepare('UPDATE materials SET quantity=?,status=?,updated_at=? WHERE id=?'); $up->execute([$qty,$status,now(),$m['id']]);
  $up=$pdo->prepare("UPDATE stock_out SET status=\'Confirmed\',updated_at=? WHERE id=?"); $up->execute([now(),$id]);
  $drid=cleanId(); $drno='DR-'.date('YmdHis').'-'.substr($id,0,6); $dr=$pdo->prepare('INSERT INTO delivery_receipts (id,dr_number,order_number,client,items,sku,quantity,date,released_by,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'); $dr->execute([$drid,$drno,$item['order_ref'],$item['destination'],$item['material'],$item['sku'],$item['quantity'],gmdate('Y-m-d'),$actor['name'],'Released',now(),now()]);
  $txid=cleanId(); $tx=$pdo->prepare('INSERT INTO transactions (id,order_id,account_id,actor_user_id,actor_role,type,status,title,message,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)'); $tx->execute([$txid,null,null,$actor['id'],$actor['role'],'STOCK_OUT','Confirmed','Stock released',"{$item['quantity']} {$item['material']} released to {$item['destination']}.",now()]);
  $pdo->commit(); $st=$pdo->prepare('SELECT * FROM stock_out WHERE id=?'); $st->execute([$id]); jsonResponse(true,mapRow('stock_out',$st->fetch()));
}

if ($action==='transaction_status') {
  $orderId=(string)($input['orderId']??''); $status=(string)($input['status']??''); $message=trim((string)($input['message']??''));
  if(!$orderId||!$status) jsonResponse(false,null,'Order and status are required.',422);
  if (!in_array($current['role'],['admin','staff'],true)) {
    $own=$pdo->prepare('SELECT account_id,status FROM orders WHERE id=?'); $own->execute([$orderId]); $o=$own->fetch();
    if ($status!=='Cancelled' || !$o || (string)$o['account_id']!==(string)$current['id'] || in_array($o['status'],['Released','Delivered','Cancelled'],true)) jsonResponse(false,null,'Only staff or admin can update transaction status.',403);
  }
  $st=$pdo->prepare('UPDATE orders SET status=?, updated_at=? WHERE id=?'); $st->execute([$status,now(),$orderId]); try { syncDeliveryReceipt($pdo,$orderId); } catch (Throwable $e) {}
  $tid=cleanId(); $tx=$pdo->prepare('INSERT INTO transactions (id,order_id,account_id,actor_user_id,actor_role,type,status,title,message,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)'); $tx->execute([$tid,$orderId,null,$current['id'],$current['role'],'ORDER_STATUS',$status,'Order status updated',$message?:"Order status changed to $status.",now()]);
  $ord=$pdo->prepare('SELECT * FROM orders WHERE id=?'); $ord->execute([$orderId]); $order=$ord->fetch(); if($order && $order['account_id']) { $nid=cleanId(); $nt=$pdo->prepare('INSERT INTO notifications (id,audience,account_id,title,body,created_at,href) VALUES (?,?,?,?,?,?,?)'); $nt->execute([$nid,'user',$order['account_id'],'Order update',"Your order {$order['id']} is now $status.",now(),'/profile?tab=orders']); }
  jsonResponse(true,true);
}

jsonResponse(false,null,'Unsupported action.',400);
