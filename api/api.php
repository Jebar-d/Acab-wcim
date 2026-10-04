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
function saveMaterialImage(string $dataUrl): string {
  if (strlen($dataUrl) > 5700000 || !preg_match('/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+\/=]+)$/', $dataUrl, $match)) {
    jsonResponse(false, null, 'Choose a valid JPG, PNG, or WEBP image no larger than 4 MB.', 422);
  }
  $binary=base64_decode($match[2],true);
  if ($binary===false || strlen($binary)===0 || strlen($binary)>4*1024*1024) jsonResponse(false,null,'Image must be no larger than 4 MB.',422);
  $info=@getimagesizefromstring($binary);
  $mime=$info['mime']??'';
  $extensions=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
  if (!$info || !isset($extensions[$mime]) || $mime!=='image/'.$match[1] && !($match[1]==='jpeg' && $mime==='image/jpeg')) jsonResponse(false,null,'The uploaded file is not a valid JPG, PNG, or WEBP image.',422);
  $directory=__DIR__.DIRECTORY_SEPARATOR.'uploads'.DIRECTORY_SEPARATOR.'materials';
  if (!is_dir($directory) && !mkdir($directory,0755,true) && !is_dir($directory)) jsonResponse(false,null,'Image storage is not writable.',500);
  $filename=bin2hex(random_bytes(16)).'.'.$extensions[$mime];
  if (file_put_contents($directory.DIRECTORY_SEPARATOR.$filename,$binary,LOCK_EX)===false) jsonResponse(false,null,'Could not save the material image.',500);
  return 'uploads/materials/'.$filename;
}

function materialImageColumn(PDO $pdo): string {
  static $column = null;
  if ($column !== null) return $column;
  $st=$pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='materials' AND COLUMN_NAME IN ('img_url','image_url') ORDER BY FIELD(COLUMN_NAME,'img_url','image_url') LIMIT 1");
  $found=$st->fetchColumn();
  if (!in_array($found,['img_url','image_url'],true)) jsonResponse(false,null,'The materials table needs its existing img_url or image_url column for product images.',500);
  $column=(string)$found;
  return $column;
}
function deleteMaterialImageFile(?string $imageUrl): void {
  if (!$imageUrl || !preg_match('#^uploads/materials/([a-f0-9]{32}\.(?:jpg|png|webp))$#',$imageUrl,$match)) return;
  $path=__DIR__.DIRECTORY_SEPARATOR.'uploads'.DIRECTORY_SEPARATOR.'materials'.DIRECTORY_SEPARATOR.$match[1];
  if (is_file($path)) @unlink($path);
}
function notificationExists(PDO $pdo, string $audience, ?string $accountId, string $title, string $body): bool {
  $stmt = $pdo->prepare('SELECT id FROM notifications WHERE audience=? AND title=? AND body=? AND (account_id IS NULL OR account_id=?) LIMIT 1');
  $stmt->execute([$audience, $title, $body, $accountId ?? '']);
  return (bool) $stmt->fetch();
}
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
      'status'=>$row['status'],'createdAt'=>$row['created_at'],'reviewedBy'=>$row['reviewed_by'],'reviewedAt'=>$row['reviewed_at']
    ];
    case 'materials': return ['id'=>$row['id'],'sku'=>$row['sku'],'name'=>$row['name'],'category'=>$row['category'],'unit'=>$row['unit'],'quantity'=>(float)$row['quantity'],'minimumStock'=>(float)$row['minimum_stock'],'status'=>$row['status'],'imageUrl'=>$row['img_url']??$row['image_url']??null,'createdAt'=>$row['created_at']];
    case 'categories': return ['id'=>$row['id'],'name'=>$row['name'],'description'=>$row['description'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'clients': return ['id'=>$row['id'],'accountId'=>$row['account_id'],'name'=>$row['name'],'email'=>$row['email'],'phone'=>$row['phone'],'company'=>$row['company'],'address'=>$row['address'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'suppliers': return ['id'=>$row['id'],'name'=>$row['name'],'contact'=>$row['contact'],'phone'=>$row['phone'],'email'=>$row['email'],'address'=>$row['address'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'inquiries': return ['id'=>$row['id'],'accountId'=>$row['account_id'],'project'=>$row['project'],'projectType'=>$row['project_type'],'location'=>$row['location'],'materials'=>$row['materials'],'quantity'=>$row['quantity'],'timeline'=>$row['timeline'],'notes'=>$row['notes'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'quotations': return ['id'=>$row['id'],'inquiryId'=>$row['inquiry_id'],'clientId'=>$row['client_id'],'accountId'=>$row['account_id'],'customerName'=>$row['customer_name'],'customerEmail'=>$row['customer_email'] ?? null,'customerPhone'=>$row['customer_phone'] ?? null,'projectName'=>$row['project_name'],'projectType'=>$row['project_type'],'location'=>$row['location'],'materials'=>$row['materials'],'quantity'=>$row['quantity'],'timeline'=>$row['timeline'],'notes'=>$row['notes'],'status'=>$row['status'],'inventoryStatus'=>$row['inventory_status'],'checklistStatus'=>$row['checklist_status'],'confirmedAt'=>$row['confirmed_at'],'confirmationSentAt'=>$row['confirmation_sent_at'],'customerConfirmedAt'=>$row['customer_confirmed_at'],'orderId'=>$row['order_id'],'createdAt'=>$row['created_at'],'expiresAt'=>$row['expires_at'],'cancelledAt'=>$row['cancelled_at'],'cancelledBy'=>$row['cancelled_by'],'cancelReason'=>$row['cancel_reason']];
    case 'orders': return ['id'=>$row['id'],'quotationId'=>$row['quotation_id'],'inquiryId'=>$row['inquiry_id'],'clientId'=>$row['client_id'],'accountId'=>$row['account_id'],'projectName'=>$row['project_name'],'clientName'=>$row['client_name'],'materials'=>$row['materials'],'quantity'=>$row['quantity'],'status'=>$row['status'],'deliveryMethod'=>$row['delivery_method'],'deliveryAddressId'=>$row['delivery_address_id'],'paymentMethod'=>$row['payment_method'],'notes'=>$row['notes'],'confirmedAt'=>$row['confirmed_at'],'createdAt'=>$row['created_at']];
    case 'delivery_receipts': return ['id'=>$row['id'],'drNumber'=>$row['dr_number'],'orderNumber'=>$row['order_number'],'client'=>$row['client'],'items'=>$row['items'],'sku'=>$row['sku'],'quantity'=>(float)$row['quantity'],'date'=>$row['date'],'releasedBy'=>$row['released_by'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'stock_in': return ['id'=>$row['id'],'stockInId'=>$row['stock_in_id'],'reference'=>$row['stock_in_id'],'sku'=>$row['sku'],'material'=>$row['material'],'quantity'=>(float)$row['quantity'],'supplier'=>$row['supplier'],'receivedBy'=>$row['received_by'],'date'=>$row['date'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'stock_out': return ['id'=>$row['id'],'stockOutId'=>$row['stock_out_id'],'sku'=>$row['sku'],'material'=>$row['material'],'quantity'=>(float)$row['quantity'],'orderRef'=>$row['order_ref'],'destination'=>$row['destination'],'warehouseStaff'=>$row['warehouse_staff'],'date'=>$row['date'],'status'=>$row['status'],'createdAt'=>$row['created_at']];
    case 'checklists': return ['id'=>$row['id'],'title'=>$row['title'],'status'=>$row['status'],'items'=>$row['items_json']?json_decode($row['items_json'],true):[],'createdAt'=>$row['created_at']];
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
  jsonResponse(true, sessionUser($pdo));
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
if ($action==='quotation_validate_confirmation') {
  $actor=requireRole($pdo,['user']); $id=(string)($input['quotationId']??''); $st=$pdo->prepare('SELECT status,expires_at,materials FROM quotations WHERE id=? AND account_id=?'); $st->execute([$id,$actor['id']]); $quote=$st->fetch();
  if (!$quote || $quote['status']!=='confirmed') jsonResponse(false,null,'This quotation is not available for confirmation.',422);
  if ($quote['expires_at'] && strtotime($quote['expires_at'])<time()) jsonResponse(false,null,'This quotation has expired. Please request an updated quotation.',422);
  $items=json_decode((string)$quote['materials'],true);
  if (!is_array($items)||!count($items)) jsonResponse(false,null,'This quotation has no valid material items.',422);
  foreach ($items as $item) { $m=$pdo->prepare('SELECT quantity,status FROM materials WHERE id=?'); $m->execute([(string)($item['materialId']??'')]); $stock=$m->fetch(); if (!$stock || $stock['status']==='Unavailable' || (float)($item['quantity']??0)>(float)$stock['quantity']) jsonResponse(false,null,'Requested quantity exceeds current inventory availability.',422); }
  jsonResponse(true,true);
}

if ($action==='order_edit_submit') {
  $actor=requireRole($pdo,['user']); $orderId=(string)($input['orderId']??''); $items=$input['items']??[];
  if (!is_array($items) || count($items)===0) jsonResponse(false,null,'An edited order must contain at least one material.',422);
  $pdo->beginTransaction();
  try {
    $q=$pdo->prepare('SELECT * FROM orders WHERE id=? AND account_id=? FOR UPDATE'); $q->execute([$orderId,$actor['id']]); $order=$q->fetch();
    if (!$order || !in_array($order['status'],['Confirmed','Pending','APPROVED'],true)) { $pdo->rollBack(); jsonResponse(false,null,'This order cannot be edited in its current state.',422); }
    $pending=$pdo->prepare("SELECT id FROM order_edit_requests WHERE order_id=? AND status='PENDING' LIMIT 1"); $pending->execute([$orderId]);
    if ($pending->fetch()) { $pdo->rollBack(); jsonResponse(false,null,'This order already has an edit request awaiting review.',409); }
    $clean=[]; $seen=[];
    foreach ($items as $item) {
      $mid=(string)($item['materialId']??''); $qty=(float)($item['quantity']??0);
      if (!$mid || !is_finite($qty) || $qty<=0) { $pdo->rollBack(); jsonResponse(false,null,'Every item needs a valid material and quantity greater than zero.',422); }
      if (isset($seen[$mid])) { $pdo->rollBack(); jsonResponse(false,null,'A material can only appear once in the edited order.',422); }
      $seen[$mid]=true;
      $imageColumn=materialImageColumn($pdo);
      $m=$pdo->prepare("SELECT id,sku,name,category,unit,quantity,status,`$imageColumn` AS material_image_url FROM materials WHERE id=?"); $m->execute([$mid]); $material=$m->fetch();
      if (!$material || $material['status']==='Unavailable' || $qty>(float)$material['quantity']) { $pdo->rollBack(); jsonResponse(false,null,'Requested quantity exceeds current inventory availability.',422); }
      $clean[]=['materialId'=>$material['id'],'sku'=>$material['sku'],'materialName'=>$material['name'],'category'=>$material['category'],'imageUrl'=>$material['material_image_url'],'quantity'=>$qty,'unit'=>$material['unit']];
    }
    $previous=json_decode($order['materials'],true); if (!is_array($previous)) $previous=[];
    $oldById=[]; foreach ($previous as $item) if (!empty($item['materialId'])) $oldById[(string)$item['materialId']]=$item;
    $newById=[]; foreach ($clean as $item) $newById[$item['materialId']]=$item;
    $changeLines=[];
    foreach ($clean as $item) {
      $old=$oldById[$item['materialId']]??null;
      if (!$old) $changeLines[]='Added: '.$item['materialName'].' — '.$item['quantity'].' '.$item['unit'];
      elseif ((float)($old['quantity']??0)!==$item['quantity']) $changeLines[]='Changed: '.$item['materialName'].' — '.($old['quantity']??0).' → '.$item['quantity'].' '.$item['unit'];
    }
    foreach ($previous as $old) if (!empty($old['materialId']) && !isset($newById[(string)$old['materialId']])) $changeLines[]='Removed: '.($old['materialName']??'Material').' — '.($old['quantity']??0).' '.($old['unit']??'');
    if (!$changeLines) { $pdo->rollBack(); jsonResponse(false,null,'No changes were made to the order.',422); }
    $id=cleanId(); $insert=$pdo->prepare("INSERT INTO order_edit_requests (id,order_id,account_id,requested_items,previous_items,previous_order_status,status,requested_at) VALUES (?,?,?,?,?,?, 'PENDING',?)");
    $insert->execute([$id,$orderId,$actor['id'],json_encode($clean),json_encode($previous),$order['status'],now()]);
    $pendingOrder=$pdo->prepare("UPDATE orders SET status='EDIT_REQUESTED',updated_at=? WHERE id=?"); $pendingOrder->execute([now(),$orderId]);
    $quoteId=(string)($order['quotation_id']??'');
    $reference=$quoteId ? 'Quotation #'.substr($quoteId,0,8) : 'Order #'.substr($orderId,0,8);
    $message="{$actor['name']} edited {$reference}.\n".implode("\n",$changeLines);
    $notice=$pdo->prepare('INSERT INTO notifications (id,audience,title,body,created_at,href) VALUES (?,?,?,?,?,?)');
    foreach (['staff','admin'] as $audience) $notice->execute([cleanId(),$audience,'Order edit request',$message,now(),$audience==='staff'?'/staff/orders?editRequestId='.$id:'/dashboard']);
    $pdo->commit(); jsonResponse(true,['id'=>$id,'status'=>'PENDING','changes'=>$changeLines]);
  } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
}

if ($action==='order_edit_review') {
  $actor=requireRole($pdo,['staff','admin']); $requestId=(string)($input['requestId']??''); $decision=(string)($input['decision']??''); $reason=trim((string)($input['reason']??''));
  if (!in_array($decision,['approve','reject'],true)) jsonResponse(false,null,'Choose approve or reject.',422);
  $pdo->beginTransaction();
  try {
    $q=$pdo->prepare("SELECT er.*,o.status AS order_status FROM order_edit_requests er JOIN orders o ON o.id=er.order_id WHERE er.id=? FOR UPDATE"); $q->execute([$requestId]); $request=$q->fetch();
    if (!$request || $request['status']!=='PENDING') { $pdo->rollBack(); jsonResponse(false,null,'Pending edit request not found.',404); }
    if ($decision==='approve') {
      if ($request['order_status']!=='EDIT_REQUESTED') { $pdo->rollBack(); jsonResponse(false,null,'The order can no longer be updated.',422); }
      $items=json_decode($request['requested_items'],true); if (!is_array($items)||!count($items)) { $pdo->rollBack(); jsonResponse(false,null,'The requested items are invalid.',422); }
      foreach ($items as $item) { $m=$pdo->prepare('SELECT quantity,status FROM materials WHERE id=? FOR UPDATE'); $m->execute([(string)($item['materialId']??'')]); $stock=$m->fetch(); if (!$stock || $stock['status']==='Unavailable' || (float)($item['quantity']??0)>(float)$stock['quantity']) { $available=$stock?(float)$stock['quantity']:0; $pdo->rollBack(); jsonResponse(false,null,"Unable to approve: only $available units are currently available.",422); } }
      $quantity=implode(', ',array_map(fn($i)=>$i['quantity'].' '.$i['unit'],$items)); $u=$pdo->prepare('UPDATE orders SET materials=?,quantity=?,status=\'APPROVED\',updated_at=? WHERE id=?'); $u->execute([json_encode($items),$quantity,now(),$request['order_id']]);
      $q=$pdo->prepare('UPDATE quotations SET materials=?,quantity=?,updated_at=? WHERE order_id=?'); $q->execute([json_encode($items),$quantity,now(),$request['order_id']]);
      $status='APPROVED'; $title='Edited quotation approved'; $body="Your edited order was approved by {$actor['name']}.";
    } else { $status='REJECTED'; $restore=$pdo->prepare('UPDATE orders SET status=?,updated_at=? WHERE id=?'); $restore->execute([$request['previous_order_status'],now(),$request['order_id']]); $title='Order update rejected'; $body="Your requested order changes were rejected.".($reason?" Reason: $reason":''); }
    $u=$pdo->prepare('UPDATE order_edit_requests SET status=?,reviewed_at=?,reviewed_by=?,rejection_reason=? WHERE id=?'); $u->execute([$status,now(),$actor['id'],$decision==='reject'?$reason:null,$requestId]);
    $href=$pdo->prepare('SELECT quotation_id FROM orders WHERE id=?'); $href->execute([$request['order_id']]); $quotationId=(string)($href->fetchColumn()?:'');
    if ($quotationId) { $reference='quotation #'.substr($quotationId,0,8); $body=str_replace('edited order','edited '.$reference,$body); $body=str_replace('order changes','changes to '.$reference,$body); }
    $n=$pdo->prepare('INSERT INTO notifications (id,audience,account_id,title,body,created_at,href) VALUES (?,?,?,?,?,?,?)'); $n->execute([cleanId(),'user',$request['account_id'],$title,$body,now(),$quotationId?'/order-confirmation/'.$quotationId:'/profile']);
    $pdo->commit(); jsonResponse(true,['id'=>$requestId,'status'=>$status]);
  } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
}
if ($action==='order_edit_list') {
  requireRole($pdo,['staff','admin']);
  $rows=$pdo->query("SELECT er.*,o.project_name,o.quotation_id,u.name AS customer_name,reviewer.name AS reviewer_name FROM order_edit_requests er JOIN orders o ON o.id=er.order_id JOIN users u ON u.id=er.account_id LEFT JOIN users reviewer ON reviewer.id=er.reviewed_by ORDER BY er.requested_at DESC")->fetchAll();
  foreach ($rows as &$row) { $row['requestedItems']=json_decode($row['requested_items'],true)?:[]; $row['previousItems']=json_decode($row['previous_items'],true)?:[]; unset($row['requested_items'],$row['previous_items']); }
  jsonResponse(true,$rows);
}

$allowed = ['clients','materials','categories','suppliers','inquiries','quotations','orders','delivery_receipts','stock_in','stock_out','checklists','checklist_items','ledger_entries','notifications','transactions','addresses','accounts'];
if ($action !== 'transaction_status' && $entity !== '' && !in_array($entity,$allowed,true)) jsonResponse(false,null,'Unknown entity.',400);

$current=sessionUser($pdo);
if ($action==='list') {
  if (!$current && $entity!=='materials' && $entity!=='categories') requireUser($pdo);
  if ($entity==='accounts') requireRole($pdo,['admin']);
  if ($entity==='quotations') $pdo->exec("UPDATE quotations SET status='expired',updated_at=UTC_TIMESTAMP() WHERE expires_at IS NOT NULL AND expires_at<=UTC_TIMESTAMP() AND customer_confirmed_at IS NULL AND status IN ('pending','reviewing','inventory-check','checklist-pending','ready','confirmed')");
  $tables=['accounts'=>'users','clients'=>'clients','materials'=>'materials','categories'=>'categories','suppliers'=>'suppliers','inquiries'=>'inquiries','quotations'=>'quotations','orders'=>'orders','delivery_receipts'=>'delivery_receipts','stock_in'=>'stock_in','stock_out'=>'stock_out','checklists'=>'checklists','checklist_items'=>'checklist_items','ledger_entries'=>'ledger_entries','notifications'=>'notifications','transactions'=>'transactions','addresses'=>'addresses'];
  $table=$tables[$entity]; $sql="SELECT * FROM `$table`"; $params=[];
  if ($entity==='notifications' && $current) { $sql.=' WHERE (audience=:audience OR audience=:all) AND (account_id IS NULL OR account_id=:account_id)'; $params['audience']=$current['role']; $params['all']='all'; $params['account_id']=$current['id']; }
  elseif ($entity==='addresses' && $current) { $sql.=' WHERE user_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='inquiries' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='quotations' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='orders' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  elseif ($entity==='transactions' && $current && $current['role']==='user') { $sql.=' WHERE account_id=:uid'; $params['uid']=$current['id']; }
  $sql.=' ORDER BY created_at DESC'; $stmt=$pdo->prepare($sql); $stmt->execute($params); $rows=array_map(fn($r)=>mapRow($entity,$r),$stmt->fetchAll()); jsonResponse(true,$rows);
}

$current=requireUser($pdo);
$actorRoles=['accounts'=>['admin'],'materials'=>['admin','staff'],'categories'=>['admin','staff'],'suppliers'=>['admin','staff'],'clients'=>['admin','staff','user'],'inquiries'=>['admin','staff','user'],'quotations'=>['admin','staff','user'],'orders'=>['admin','staff','user'],'delivery_receipts'=>['admin','staff'],'stock_in'=>['admin','staff'],'stock_out'=>['admin','staff'],'checklists'=>['admin','staff'],'checklist_items'=>['admin','staff'],'ledger_entries'=>['admin','staff'],'notifications'=>['admin','staff','user'],'transactions'=>['admin','staff','user'],'addresses'=>['admin','staff','user']];
if ($action !== 'transaction_status' && $action !== 'auth_review' && !in_array($current['role'],$actorRoles[$entity]??[],true)) jsonResponse(false,null,'You do not have permission for this entity.',403);

$tables=['accounts'=>'users','clients'=>'clients','materials'=>'materials','categories'=>'categories','suppliers'=>'suppliers','inquiries'=>'inquiries','quotations'=>'quotations','orders'=>'orders','delivery_receipts'=>'delivery_receipts','stock_in'=>'stock_in','stock_out'=>'stock_out','checklists'=>'checklists','checklist_items'=>'checklist_items','ledger_entries'=>'ledger_entries','notifications'=>'notifications','transactions'=>'transactions','addresses'=>'addresses'];
$table=$tables[$entity];

function val(array $r,string $key,mixed $default=null): mixed { return array_key_exists($key,$r)?$r[$key]:$default; }

if ($action==='create') {
  $r=$input['record']??[]; if (!is_array($r)) jsonResponse(false,null,'Invalid record.',422); $id=(string)($r['id']??cleanId()); $n=now();
  $savedMaterialImage=null;
  try {
    switch ($entity) {
      case 'accounts': jsonResponse(false,null,'Use registration to create accounts.',405);
      case 'materials': $savedMaterialImage=!empty($r['imageData'])?saveMaterialImage((string)$r['imageData']):null; $imageColumn=materialImageColumn($pdo); $st=$pdo->prepare("INSERT INTO materials (id,sku,name,category,unit,quantity,minimum_stock,status,`$imageColumn`,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)"); $st->execute([$id,val($r,'sku'),val($r,'name'),val($r,'category'),val($r,'unit'),val($r,'quantity',0),val($r,'minimumStock',0),val($r,'status','Available'),$savedMaterialImage,val($r,'createdAt',$n),$n]); break;
      case 'categories': $st=$pdo->prepare('INSERT INTO categories (id,name,description,status,created_at,updated_at) VALUES (?,?,?,?,?,?)'); $st->execute([$id,val($r,'name'),val($r,'description'),val($r,'status','active'),val($r,'createdAt',$n),$n]); break;
      case 'clients': $st=$pdo->prepare('INSERT INTO clients (id,account_id,name,email,phone,company,address,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'accountId'),val($r,'name'),val($r,'email'),val($r,'phone'),val($r,'company'),val($r,'address'),val($r,'status','active'),val($r,'createdAt',$n),$n]); break;
      case 'suppliers': $st=$pdo->prepare('INSERT INTO suppliers (id,name,contact,phone,email,address,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'name'),val($r,'contact'),val($r,'phone'),val($r,'email'),val($r,'address'),val($r,'status','active'),$n]); break;
      case 'inquiries': $st=$pdo->prepare('INSERT INTO inquiries (id,account_id,project,project_type,location,materials,quantity,timeline,notes,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'accountId',$current['id']),val($r,'project'),val($r,'projectType'),val($r,'location'),val($r,'materials'),val($r,'quantity'),val($r,'timeline'),val($r,'notes'),val($r,'status','pending'),val($r,'createdAt',$n),$n]); break;
      case 'quotations':
        if ($current['role']==='user') {
          $r['accountId']=$current['id'];
          $items=json_decode((string)val($r,'materials',''),true);
          if (!is_array($items) || count($items)===0) jsonResponse(false,null,'Select at least one inventory material.',422);
          foreach ($items as $item) {
            $mid=(string)($item['materialId']??''); $qty=(float)($item['quantity']??0);
            if (!$mid || !is_finite($qty) || $qty<=0) jsonResponse(false,null,'Each material quantity must be greater than zero.',422);
            $stock=$pdo->prepare('SELECT quantity,status FROM materials WHERE id=?'); $stock->execute([$mid]); $available=$stock->fetch();
            if (!$available || $available['status']==='Unavailable' || $qty>(float)$available['quantity']) jsonResponse(false,null,'Requested quantity exceeds current inventory availability.',422);
          }
          $r['status']='pending';
        }
        $expiresAt=gmdate('Y-m-d H:i:s',time()+3*86400);
        $st=$pdo->prepare('INSERT INTO quotations (id,inquiry_id,client_id,account_id,customer_name,customer_email,customer_phone,project_name,project_type,location,materials,quantity,timeline,notes,status,inventory_status,checklist_status,confirmed_at,confirmation_sent_at,customer_confirmed_at,order_id,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'inquiryId'),val($r,'clientId'),val($r,'accountId'),val($r,'customerName'),val($r,'customerEmail'),val($r,'customerPhone'),val($r,'projectName'),val($r,'projectType'),val($r,'location'),val($r,'materials'),val($r,'quantity'),val($r,'timeline'),val($r,'notes'),val($r,'status','pending'),val($r,'inventoryStatus'),val($r,'checklistStatus'),val($r,'confirmedAt'),val($r,'confirmationSentAt'),val($r,'customerConfirmedAt'),val($r,'orderId'),$expiresAt,val($r,'createdAt',$n),$n]); break;
      case 'orders': $st=$pdo->prepare('INSERT INTO orders (id,quotation_id,inquiry_id,client_id,account_id,project_name,client_name,materials,quantity,status,delivery_method,delivery_address_id,payment_method,notes,confirmed_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'quotationId'),val($r,'inquiryId'),val($r,'clientId'),val($r,'accountId',$current['role']==='user'?$current['id']:null),val($r,'projectName'),val($r,'clientName'),val($r,'materials'),val($r,'quantity'),val($r,'status','Pending'),val($r,'deliveryMethod'),val($r,'deliveryAddressId'),val($r,'paymentMethod'),val($r,'notes'),val($r,'confirmedAt'),val($r,'createdAt',$n),$n]); break;
      case 'delivery_receipts': $st=$pdo->prepare('INSERT INTO delivery_receipts (id,dr_number,order_number,client,items,sku,quantity,date,released_by,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'drNumber'),val($r,'orderNumber'),val($r,'client'),val($r,'items'),val($r,'sku',''),val($r,'quantity',0),val($r,'date',gmdate('Y-m-d')),$current['name'],val($r,'status','Draft'),val($r,'createdAt',$n),$n]); break;
      case 'stock_in': $st=$pdo->prepare('INSERT INTO stock_in (id,stock_in_id,sku,material,quantity,supplier,received_by,date,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'stockInId'),val($r,'sku'),val($r,'material'),val($r,'quantity',0),val($r,'supplier'),val($r,'receivedBy'),val($r,'date',gmdate('Y-m-d')),val($r,'status','Confirmed'),val($r,'createdAt',$n),$n]); break;
      case 'stock_out': $st=$pdo->prepare('INSERT INTO stock_out (id,stock_out_id,sku,material,quantity,order_ref,destination,warehouse_staff,date,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'stockOutId'),val($r,'sku'),val($r,'material'),val($r,'quantity',0),val($r,'orderRef'),val($r,'destination'),val($r,'warehouseStaff'),val($r,'date',gmdate('Y-m-d')),val($r,'status','Draft'),val($r,'createdAt',$n),$n]); break;
      case 'checklists': $st=$pdo->prepare('INSERT INTO checklists (id,title,status,items_json,created_at,updated_at) VALUES (?,?,?,?,?,?)'); $st->execute([$id,val($r,'title'),val($r,'status','Checklist Pending'),isset($r['items'])?json_encode($r['items']):'[]',val($r,'createdAt',$n),$n]); break;
      case 'checklist_items': $st=$pdo->prepare('INSERT INTO checklist_items (id,checklist_id,label,completed,created_at,updated_at) VALUES (?,?,?,?,?,?)'); $st->execute([$id,val($r,'checklistId'),val($r,'label'),boolish(val($r,'completed')),val($r,'createdAt',$n),$n]); break;
      case 'ledger_entries': $st=$pdo->prepare('INSERT INTO ledger_entries (id,type,reference,description,amount,date_value,party,project,status,source,source_id,debit,credit,balance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'type','Project Transaction'),val($r,'reference'),val($r,'description'),val($r,'amount',0),val($r,'date',gmdate('Y-m-d')),val($r,'party'),val($r,'project'),val($r,'status','Posted'),val($r,'source'),val($r,'sourceId'),val($r,'debit',0),val($r,'credit',0),val($r,'balance',0),val($r,'createdAt',$n),$n]); break;
      case 'notifications': $st=$pdo->prepare('INSERT INTO notifications (id,audience,account_id,title,body,created_at,read_at,href) VALUES (?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'audience'),val($r,'accountId'),val($r,'title'),val($r,'body'),val($r,'createdAt',$n),val($r,'read')? $n:null,val($r,'href')]); break;
      case 'transactions': $st=$pdo->prepare('INSERT INTO transactions (id,order_id,account_id,actor_user_id,actor_role,type,status,title,message,metadata,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'orderId'),val($r,'accountId',$current['role']==='user'?$current['id']:null),val($r,'actorUserId',$current['id']),val($r,'actorRole',$current['role']),val($r,'type'),val($r,'status'),val($r,'title'),val($r,'message'),isset($r['metadata'])?json_encode($r['metadata']):null,val($r,'createdAt',$n)]); break;
      case 'addresses': $st=$pdo->prepare('INSERT INTO addresses (id,user_id,label,recipient_name,phone,line1,line2,barangay,city,province,postal_code,is_default,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $st->execute([$id,val($r,'userId',$current['id']),val($r,'label','Primary'),val($r,'recipientName',$current['name']),val($r,'phone'),val($r,'line1'),val($r,'line2'),val($r,'barangay'),val($r,'city'),val($r,'province'),val($r,'postalCode'),boolish(val($r,'isDefault')),val($r,'createdAt',$n),$n]); break;
    }
    if ($entity==='stock_in') {
      $mat=$pdo->prepare('SELECT * FROM materials WHERE sku=? OR LOWER(name)=LOWER(?) LIMIT 1'); $mat->execute([val($r,'sku'),val($r,'material')]); $m=$mat->fetch();
      if ($m) { $qty=(float)$m['quantity']+(float)val($r,'quantity',0); $status=$qty <= (float)$m['minimum_stock'] ? 'Limited' : 'Available'; $up=$pdo->prepare('UPDATE materials SET quantity=?,status=?,updated_at=? WHERE id=?'); $up->execute([$qty,$status,now(),$m['id']]); }
    }
    $st=$pdo->prepare("SELECT * FROM `$table` WHERE id=?"); $st->execute([$id]); $row=$st->fetch(); if (!$row) jsonResponse(false,null,'Record could not be created.',500); jsonResponse(true,mapRow($entity,$row));
  } catch (Throwable $e) { if ($savedMaterialImage) deleteMaterialImageFile($savedMaterialImage); jsonResponse(false,null,$e->getMessage(),422); }
}

if ($action==='update') {
  $id=(string)($input['id']??''); $patch=$input['patch']??[]; if (!$id || !is_array($patch)) jsonResponse(false,null,'Invalid update.',422); $columns=[
    'materials'=>['sku'=>'sku','name'=>'name','category'=>'category','unit'=>'unit','quantity'=>'quantity','minimumStock'=>'minimum_stock','status'=>'status'],
    'categories'=>['name'=>'name','description'=>'description','status'=>'status'], 'clients'=>['accountId'=>'account_id','name'=>'name','email'=>'email','phone'=>'phone','company'=>'company','address'=>'address','status'=>'status'], 'suppliers'=>['name'=>'name','contact'=>'contact','phone'=>'phone','email'=>'email','address'=>'address','status'=>'status'],
    'inquiries'=>['accountId'=>'account_id','project'=>'project','projectType'=>'project_type','location'=>'location','materials'=>'materials','quantity'=>'quantity','timeline'=>'timeline','notes'=>'notes','status'=>'status'],
    'quotations'=>['inquiryId'=>'inquiry_id','clientId'=>'client_id','accountId'=>'account_id','customerName'=>'customer_name','customerEmail'=>'customer_email','customerPhone'=>'customer_phone','projectName'=>'project_name','projectType'=>'project_type','location'=>'location','materials'=>'materials','quantity'=>'quantity','timeline'=>'timeline','notes'=>'notes','status'=>'status','inventoryStatus'=>'inventory_status','checklistStatus'=>'checklist_status','confirmedAt'=>'confirmed_at','confirmationSentAt'=>'confirmation_sent_at','customerConfirmedAt'=>'customer_confirmed_at','orderId'=>'order_id','expiresAt'=>'expires_at','cancelledAt'=>'cancelled_at','cancelledBy'=>'cancelled_by','cancelReason'=>'cancel_reason'],
    'orders'=>['quotationId'=>'quotation_id','inquiryId'=>'inquiry_id','clientId'=>'client_id','accountId'=>'account_id','projectName'=>'project_name','clientName'=>'client_name','materials'=>'materials','quantity'=>'quantity','status'=>'status','deliveryMethod'=>'delivery_method','deliveryAddressId'=>'delivery_address_id','paymentMethod'=>'payment_method','notes'=>'notes','confirmedAt'=>'confirmed_at'],
    'delivery_receipts'=>['drNumber'=>'dr_number','orderNumber'=>'order_number','client'=>'client','items'=>'items','sku'=>'sku','quantity'=>'quantity','date'=>'date','releasedBy'=>'released_by','status'=>'status'],
    'stock_in'=>['stockInId'=>'stock_in_id','reference'=>'stock_in_id','sku'=>'sku','material'=>'material','quantity'=>'quantity','supplier'=>'supplier','receivedBy'=>'received_by','date'=>'date','status'=>'status'],
    'stock_out'=>['stockOutId'=>'stock_out_id','sku'=>'sku','material'=>'material','quantity'=>'quantity','orderRef'=>'order_ref','destination'=>'destination','warehouseStaff'=>'warehouse_staff','date'=>'date','status'=>'status'],
    'checklists'=>['title'=>'title','status'=>'status','items'=>'items_json'], 'checklist_items'=>['checklistId'=>'checklist_id','label'=>'label','completed'=>'completed'],
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
  $oldMaterialImage=null; $newMaterialImage=null; $removeMaterialImage=false;
  $imageColumn=null;
  if ($entity==='materials') {
    $imageColumn=materialImageColumn($pdo);
    $currentImage=$pdo->prepare("SELECT `$imageColumn` FROM materials WHERE id=?"); $currentImage->execute([$id]); $imageRow=$currentImage->fetch();
    if (!$imageRow) jsonResponse(false,null,'Material not found.',404);
    $oldMaterialImage=$imageRow[$imageColumn];
    if (array_key_exists('imageData',$patch)) {
      $imageData=(string)$patch['imageData']; unset($patch['imageData']);
      if ($imageData==='__REMOVE_IMAGE__') { $patch['imageUrl']=null; $mapped['imageUrl']=$imageColumn; $removeMaterialImage=true; }
      elseif ($imageData!=='') { $newMaterialImage=saveMaterialImage($imageData); $patch['imageUrl']=$newMaterialImage; $mapped['imageUrl']=$imageColumn; }
    }
  }
  if ($entity==='quotations' && $current['role']==='user') {
    $quote=$pdo->prepare('SELECT account_id,status,expires_at,customer_confirmed_at,order_id FROM quotations WHERE id=?'); $quote->execute([$id]); $owned=$quote->fetch();
    if (!$owned || $owned['account_id']!==$current['id']) jsonResponse(false,null,'Quotation not found.',404);
    if (array_diff(array_keys($patch),['customerConfirmedAt','orderId','status','cancelledAt','cancelledBy','cancelReason'])) jsonResponse(false,null,'Customers cannot change quotation details.',403);
    if (array_key_exists('customerConfirmedAt',$patch) && ($owned['status']!=='confirmed' || ($owned['expires_at'] && strtotime($owned['expires_at'])<time()))) jsonResponse(false,null,'This quotation is not active and cannot be confirmed.',422);
    if (isset($patch['status']) && ($patch['status']!=='cancelled' || !in_array($owned['status'],['pending','reviewing','inventory-check','checklist-pending','ready','confirmed'],true) || $owned['order_id'] || $owned['customer_confirmed_at'])) jsonResponse(false,null,'This quotation cannot be cancelled in its current state.',422);
    if (($patch['status']??null)==='cancelled') { $patch['cancelledAt']=now(); $patch['cancelledBy']=$current['id']; }
  }
  if ($entity==='quotations' && isset($patch['status']) && $patch['status']==='confirmed') {
    $expiry=$pdo->prepare('SELECT expires_at FROM quotations WHERE id=?'); $expiry->execute([$id]); $validUntil=$expiry->fetchColumn();
    if ($validUntil && strtotime((string)$validUntil)<time()) jsonResponse(false,null,'This quotation has expired and cannot be confirmed.',422);
  }
  if ($entity==='orders' && $current['role']==='user') {
    $order=$pdo->prepare('SELECT account_id,status FROM orders WHERE id=?'); $order->execute([$id]); $owned=$order->fetch();
    if (!$owned || $owned['account_id']!==$current['id']) jsonResponse(false,null,'Order not found.',404);
    jsonResponse(false,null,'Order changes must be submitted as an edit request.',403);
  }
  $sets=[];$params=[];
  foreach($patch as $k=>$v){ if(!isset($mapped[$k])) continue; $sets[]='`'.$mapped[$k].'`=?'; if($entity==='notifications' && $k==='read') $v=$v?now():null; if(in_array($k,['completed','isDefault','notificationEmail'],true)) $v=boolish($v); if($k==='metadata' || $k==='items') $v=json_encode($v); $params[]=$v; }
  if (!$sets) jsonResponse(false,null,'No editable fields supplied.',422); $sets[]='updated_at=?'; $params[]=now(); $params[]=$id;
  try { $st=$pdo->prepare("UPDATE `$table` SET ".implode(',',$sets)." WHERE id=?"); $st->execute($params); $st=$pdo->prepare("SELECT * FROM `$table` WHERE id=?"); $st->execute([$id]); $row=$st->fetch(); if(!$row) { if ($newMaterialImage) deleteMaterialImageFile($newMaterialImage); jsonResponse(false,null,'Record not found.',404); } }
  catch (Throwable $e) { if ($newMaterialImage) deleteMaterialImageFile($newMaterialImage); throw $e; }
  if (($newMaterialImage || $removeMaterialImage) && $oldMaterialImage) deleteMaterialImageFile($oldMaterialImage);
  if ($entity==='quotations' && ($patch['status']??null)==='cancelled' && $current['role']==='user') {
    $body="{$current['name']} cancelled quotation #".substr($id,0,8)." for {$row['project_name']}.";
    foreach (['staff','admin'] as $audience) { $notice=$pdo->prepare('INSERT INTO notifications (id,audience,title,body,created_at,href) VALUES (?,?,?,?,?,?)'); $notice->execute([cleanId(),$audience,'Quotation cancelled',$body,now(),'/staff/quotations']); }
  }
  jsonResponse(true,mapRow($entity,$row));
}

if ($action==='delete') {
  $id=(string)($input['id']??'');
  if (!$id) jsonResponse(false,null,'Record id is required.',422);
  $materialImage=null; if ($entity==='materials') { $imageColumn=materialImageColumn($pdo); $img=$pdo->prepare("SELECT `$imageColumn` FROM materials WHERE id=?"); $img->execute([$id]); $materialImage=$img->fetchColumn()?:null; }
  $st=$pdo->prepare("DELETE FROM `$table` WHERE id=?"); $st->execute([$id]);
  if ($entity==='materials' && $st->rowCount()>0) deleteMaterialImageFile($materialImage);
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

  $ord=$pdo->prepare('SELECT * FROM orders WHERE id=?');
  $ord->execute([$orderId]);
  $order=$ord->fetch();
  if (!$order) jsonResponse(false,null,'Order not found.',404);
  $validStatuses=['Pending','Confirmed','APPROVED','Preparing','Ready for Release','Released','Delivered','Cancelled'];
  if (!in_array($status,$validStatuses,true)) jsonResponse(false,null,'Unsupported order status.',422);
  if ($current['role']==='user' && ($status!=='Cancelled' || !in_array($order['status'],['Pending','Confirmed','APPROVED'],true))) jsonResponse(false,null,'You may only cancel an order before preparation begins.',403);

  $canManageOrder = in_array($current['role'],['admin','staff'],true) || ($current['role']==='user' && $order['account_id'] === $current['id']);
  if (!$canManageOrder) jsonResponse(false,null,'You cannot update this order status.',403);

  $statusTitles = [
    'Pending' => 'Order is pending',
    'Confirmed' => 'Order confirmed',
    'Preparing' => 'Order is being prepared',
    'Ready for Release' => 'Your order is ready for release',
    'Released' => 'Your order has been released',
    'Delivered' => 'Your order has been delivered',
    'Cancelled' => 'Your order has been cancelled',
  ];

  $statusMessage = $statusTitles[$status] ?? "Your order is now $status.";
  $notificationText = $message ?: $statusMessage;

  $st=$pdo->prepare('UPDATE orders SET status=?, updated_at=? WHERE id=?');
  $st->execute([$status,now(),$orderId]);
  if ($current['role']==='user' && $status==='Cancelled' && $order['quotation_id']) {
    $cancelQuote=$pdo->prepare("UPDATE quotations SET status='cancelled',cancelled_at=?,cancelled_by=?,cancel_reason=?,updated_at=? WHERE id=?");
    $cancelQuote->execute([now(),$current['id'],$message?:'Customer cancelled the order.',now(),$order['quotation_id']]);
  }

  $tid=cleanId();
  $tx=$pdo->prepare('INSERT INTO transactions (id,order_id,account_id,actor_user_id,actor_role,type,status,title,message,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
  $tx->execute([$tid,$orderId,$order['account_id'],$current['id'],$current['role'],'ORDER_STATUS',$status,'Order status updated',$message ?: "Order status changed to $status.",now()]);

  if ($order['account_id']) {
    $userTitle = $status === 'Cancelled' ? 'Order cancelled' : 'Order update';
    if (!notificationExists($pdo, 'user', $order['account_id'], $userTitle, $notificationText)) {
      $nid=cleanId();
      $nt=$pdo->prepare('INSERT INTO notifications (id,audience,account_id,title,body,created_at,href) VALUES (?,?,?,?,?,?,?)');
      $nt->execute([$nid,'user',$order['account_id'],$userTitle,$notificationText,now(),'/profile?tab=orders']);
    }

    if ($status === 'Cancelled') {
      $staffBody = "Customer {$order['account_id']} cancelled order {$order['id']}.
";
      if (!notificationExists($pdo, 'staff', null, 'Customer cancelled order', $staffBody)) {
        $staffCancel = $pdo->prepare('INSERT INTO notifications (id,audience,title,body,created_at,href) VALUES (?,?,?,?,?,?)');
        $staffCancel->execute([cleanId(),'staff','Customer cancelled order',$staffBody,now(),'/staff/orders']);
      }

      $adminBody = "Customer {$order['account_id']} cancelled order {$order['id']}.
";
      if (!notificationExists($pdo, 'admin', null, 'Customer cancelled order', $adminBody)) {
        $adminCancel = $pdo->prepare('INSERT INTO notifications (id,audience,title,body,created_at,href) VALUES (?,?,?,?,?,?)');
        $adminCancel->execute([cleanId(),'admin','Customer cancelled order',$adminBody,now(),'/dashboard']);
      }
    } elseif ($status !== 'Cancelled') {
      $staffBody = "Order {$order['id']} is now $status.";
      if (!notificationExists($pdo, 'staff', null, 'Order status update', $staffBody)) {
        $staffNotice=$pdo->prepare('INSERT INTO notifications (id,audience,title,body,created_at,href) VALUES (?,?,?,?,?,?)');
        $staffNotice->execute([cleanId(),'staff','Order status update',$staffBody,now(),'/staff/orders']);
      }
    }
  }

  jsonResponse(true,true);
}

jsonResponse(false,null,'Unsupported action.',400);
